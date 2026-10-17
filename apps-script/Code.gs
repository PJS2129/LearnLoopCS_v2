/**
 * LearnLoopCS - 채점 및 시험 관리 서버 (Google Apps Script)
 *
 * 본 스크립트는 결과 스프레드시트에 컨테이너 바인딩되어 동작합니다.
 * 스프레드시트 URL이나 ID는 코드에 적지 않으며, SpreadsheetApp.getActiveSpreadsheet()로 접근합니다.
 *
 * [스크립트 속성(Script Properties) 필수 설정]
 * 1. FIREBASE_API_KEY : Firebase Web API Key (토큰 검증용)
 * 2. ADMIN_EMAILS     : 관리자 이메일 목록 (쉼표로 구분, 예: admin@example.ac.kr,prof@example.ac.kr)
 * 3. GEMINI_API_KEY   : (5단계 성적 분석 AI 요약용)
 */

var SHEET_TABS = {
  ANSWER_KEY: '정답표',
  SUBMISSIONS: '응시결과',
  TEST_SUBMISSIONS: '테스트응시',
  ANONYMOUS_ANALYSIS: '익명분석'
};

var ANSWER_KEY_HEADERS = [
  '시험ID',
  '문항번호',
  '정답',
  '영역',
  '난이도',
  '핵심개념',
  '출처근거',
  '해설',
  '확정시각',
  '확정자'
];

/**
 * 웹 앱 POST 핸들러
 * 브라우저에서 CORS preflight(사전 요청) 없이 통신할 수 있도록 text/plain 본문을 JSON으로 파싱합니다.
 */
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return createJsonResponse({ success: false, error: '요청 본문이 비어 있습니다.' });
    }

    var payload = JSON.parse(e.postData.contents);
    var action = payload.action;
    var idToken = payload.idToken;

    if (!idToken) {
      return createJsonResponse({ success: false, error: '인증 토큰(idToken)이 누락되었습니다.' });
    }

    // 1. Firebase ID 토큰 및 관리자 권한 검증
    var authResult = verifyAdminAuth(idToken);
    if (!authResult.valid) {
      return createJsonResponse({ success: false, error: authResult.error });
    }

    var adminEmail = authResult.email;

    // 2. 액션 라우팅
    switch (action) {
      case 'finalizeExam':
        return finalizeExam(payload.examId, payload.examPackage, adminEmail);

      case 'submitExam':
        // 4단계 구현 예정 stub
        return createJsonResponse({
          success: false,
          error: '시험 제출 및 채점 기능은 4단계에서 제공됩니다.'
        });

      default:
        return createJsonResponse({
          success: false,
          error: '지원하지 않는 액션입니다: ' + action
        });
    }
  } catch (err) {
    return createJsonResponse({
      success: false,
      error: '서버 내부 오류: ' + (err.message || String(err))
    });
  }
}

/**
 * 웹 앱 GET 핸들러 (상태 점검용)
 */
function doGet(e) {
  return createJsonResponse({
    success: true,
    message: 'LearnLoopCS Apps Script Web App이 정상 작동 중입니다.',
    timestamp: new Date().toISOString()
  });
}

/**
 * Firebase ID 토큰 유효성 및 관리자 이메일 검증
 * Google Identity Toolkit API(accounts:lookup)를 호출하여 토큰 위변조, 만료 여부, 이메일 인증 여부를 확인합니다.
 */
function verifyAdminAuth(idToken) {
  var props = PropertiesService.getScriptProperties();
  var apiKey = props.getProperty('FIREBASE_API_KEY');
  var adminEmailsStr = props.getProperty('ADMIN_EMAILS') || '';

  if (!apiKey) {
    return { valid: false, error: '서버 설정 오류: FIREBASE_API_KEY 스크립트 속성이 누락되었습니다.' };
  }

  var adminList = adminEmailsStr
    .split(',')
    .map(function(em) { return em.trim().toLowerCase(); })
    .filter(function(em) { return em.length > 0; });

  if (adminList.length === 0) {
    return { valid: false, error: '서버 설정 오류: ADMIN_EMAILS 스크립트 속성에 등록된 관리자가 없습니다.' };
  }

  var lookupUrl = 'https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=' + encodeURIComponent(apiKey);
  var response;
  try {
    response = UrlFetchApp.fetch(lookupUrl, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify({ idToken: idToken }),
      muteHttpExceptions: true
    });
  } catch (netErr) {
    return { valid: false, error: '토큰 검증 API 통신 실패: ' + (netErr.message || String(netErr)) };
  }

  if (response.getResponseCode() !== 200) {
    return { valid: false, error: '유효하지 않거나 만료된 인증 토큰입니다. 다시 로그인해 주세요.' };
  }

  var data = JSON.parse(response.getContentText());
  if (!data.users || data.users.length === 0) {
    return { valid: false, error: '토큰에 해당하는 사용자 계정을 찾을 수 없습니다.' };
  }

  var user = data.users[0];
  var email = (user.email || '').toLowerCase();
  var emailVerified = Boolean(user.emailVerified);

  if (!email) {
    return { valid: false, error: '토큰에 이메일 정보가 포함되어 있지 않습니다.' };
  }

  if (!emailVerified) {
    return { valid: false, error: '이메일 인증이 완료되지 않은 계정입니다. (emailVerified false)' };
  }

  if (adminList.indexOf(email) === -1) {
    return { valid: false, error: '관리자 권한이 없는 계정입니다: ' + email };
  }

  return { valid: true, email: email };
}

/**
 * 문항 확정 및 정답표 시트 저장
 * - [정답표] 탭에 10개 열 형태로 저장
 * - 동일 시험ID의 기존 행이 존재하면 삭제 후 새 행을 추가하여 교체
 */
function finalizeExam(examId, examPackage, adminEmail) {
  if (!examId || typeof examId !== 'string') {
    return createJsonResponse({ success: false, error: '시험ID(examId)가 올바르지 않습니다.' });
  }

  if (!examPackage || !Array.isArray(examPackage.questions) || examPackage.questions.length === 0) {
    return createJsonResponse({ success: false, error: '확정할 문항 데이터가 없습니다.' });
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_TABS.ANSWER_KEY);

  // 시트가 없으면 생성하고 헤더 작성
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_TABS.ANSWER_KEY);
    sheet.appendRow(ANSWER_KEY_HEADERS);
    sheet.getRange(1, 1, 1, ANSWER_KEY_HEADERS.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }

  var lastRow = sheet.getLastRow();
  var rowsToInsert = [];
  var nowIso = new Date().toISOString();

  // 기존 시험ID 행 삭제 (역순 순회)
  if (lastRow > 1) {
    var examIdColumnValues = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    // 아래에서 위로 삭제해야 인덱스가 어긋나지 않음
    for (var r = examIdColumnValues.length - 1; r >= 0; r--) {
      if (examIdColumnValues[r][0] === examId) {
        sheet.deleteRow(r + 2); // 1행은 헤더이므로 +2
      }
    }
  }

  // 문항 정렬 (번호 순)
  var sortedQuestions = examPackage.questions.slice().sort(function(a, b) {
    return a.no - b.no;
  });

  // 새 행 구성 (10개 열)
  for (var i = 0; i < sortedQuestions.length; i++) {
    var q = sortedQuestions[i];
    rowsToInsert.push([
      examId,
      q.no,
      q.answer,
      q.domain,
      q.level,
      q.concept || '',
      q.source || '',
      q.explanation || '',
      nowIso,
      adminEmail
    ]);
  }

  if (rowsToInsert.length > 0) {
    var startRow = sheet.getLastRow() + 1;
    sheet.getRange(startRow, 1, rowsToInsert.length, ANSWER_KEY_HEADERS.length).setValues(rowsToInsert);
  }

  return createJsonResponse({
    success: true,
    message: '문항 정답표가 성공적으로 저장되었습니다.',
    examId: examId,
    questionCount: rowsToInsert.length,
    finalizedAt: nowIso,
    finalizedBy: adminEmail
  });
}

/**
 * 4단계용 시험 답안 채점 및 기록 Stub
 */
function submitExam(submissionData, studentEmail) {
  return createJsonResponse({
    success: false,
    error: '4단계에서 구현될 채점 함수입니다.'
  });
}

/**
 * JSON 응답 생성 헬퍼
 */
function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
