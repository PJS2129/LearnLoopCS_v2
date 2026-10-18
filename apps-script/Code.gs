/**
 * LearnLoopCS - 채점 및 시험 관리 서버 (Google Apps Script)
 *
 * 본 스크립트는 결과 스프레드시트에 컨테이너 바인딩되어 동작합니다.
 * 스프레드시트 URL이나 ID는 코드에 적지 않으며, SpreadsheetApp.getActiveSpreadsheet()로 접근합니다.
 *
 * [스크립트 속성(Script Properties) 필수 설정]
 * 1. FIREBASE_API_KEY    : Firebase Web API Key (토큰 검증용)
 * 2. ADMIN_EMAILS        : 관리자 이메일 목록 (쉼표로 구분, 예: admin@example.ac.kr,prof@example.ac.kr)
 * 3. FIREBASE_PROJECT_ID : (선택 사항, 토큰에서 자동 추출되나 필요 시 수동 지정 가능)
 * 4. GEMINI_API_KEY      : (5단계 성적 분석 AI 요약용)
 */

var SHEET_TABS = {
  ANSWER_KEY: '정답표',
  SUBMISSIONS: '응시결과',
  DELETED_ARCHIVE: '삭제기록',
  TEST_SUBMISSIONS: '테스트응시',
  ANONYMOUS_ANALYSIS: '익명분석'
};

var DOMAINS = [
  '기초 ICT',
  '하드웨어·CPU',
  '데이터 표현',
  '논리회로',
  '자료구조·알고리즘'
];

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

// 총 57개 열 (시험ID, 제출시각, 접수번호, 학번, 성명, 분반, UID, 1~40번 응답, 오답목록, 총점, 5개 영역별 성취도, 카메라보조 2개, 제출 방식)
var SUBMISSION_HEADERS = [
  '시험ID',
  '제출시각',
  '접수번호',
  '학번',
  '성명',
  '분반',
  'UID',
  '1번', '2번', '3번', '4번', '5번', '6번', '7번', '8번', '9번', '10번',
  '11번', '12번', '13번', '14번', '15번', '16번', '17번', '18번', '19번', '20번',
  '21번', '22번', '23번', '24번', '25번', '26번', '27번', '28번', '29번', '30번',
  '31번', '32번', '33번', '34번', '35번', '36번', '37번', '38번', '39번', '40번',
  '틀린 문항',
  '총점',
  '기초 ICT',
  '하드웨어·CPU',
  '데이터 표현',
  '논리회로',
  '자료구조·알고리즘',
  '카메라 이탈 횟수',
  '카메라 이탈 누적시간(초)',
  '제출 방식'
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

    // 액션 라우팅
    switch (action) {
      case 'finalizeExam':
        // 관리자 권한 검증 후 정답표 확정
        var adminAuth = verifyAdminAuth(idToken);
        if (!adminAuth.valid) {
          return createJsonResponse({ success: false, error: adminAuth.error });
        }
        return finalizeExam(payload.examId, payload.examPackage, adminAuth.email);

      case 'getPreviewAnswerKey':
        // 관리자 권한 검증 후 시험 미리보기용 정답 번호만 반환
        var adminPreviewAuth = verifyAdminAuth(idToken);
        if (!adminPreviewAuth.valid) {
          return createJsonResponse({ success: false, error: adminPreviewAuth.error });
        }
        return getPreviewAnswerKey(payload.examId);

      case 'submitExam':
        // 학생 제출 처리 및 서버 채점
        return submitExam(payload);

      case 'resetSubmissions':
        // 관리자 권한 검증 후 해당 시험의 응시 결과 행 초기화 (개별 또는 전체)
        var adminResetAuth = verifyAdminAuth(idToken);
        if (!adminResetAuth.valid) {
          return createJsonResponse({ success: false, error: adminResetAuth.error });
        }
        return resetSubmissions(payload.examId, payload.uid);

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
 * 웹 앱 GET 핸들러 (상태 점검 및 시트 제목줄/중복행 자동 정돈)
 */
function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var ansSheet = ensureAnswerKeySheet(ss);
    var subSheet = ensureSubmissionsSheet(ss);

    return createJsonResponse({
      success: true,
      message: 'LearnLoopCS Apps Script Web App이 정상 작동 중이며, 정답표 및 응시결과 시트의 제목줄과 중복 행이 자동으로 정돈되었습니다.',
      answerKeyRowCount: ansSheet.getLastRow(),
      submissionsRowCount: subSheet.getLastRow(),
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    return createJsonResponse({
      success: false,
      error: '시트 점검 중 오류 발생: ' + (err.message || String(err))
    });
  }
}

/**
 * Firebase ID 토큰 유효성 및 관리자 이메일 검증
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
    return { valid: false, error: '이메일 인증이 완료되지 않은 계정입니다.' };
  }

  if (adminList.indexOf(email) === -1) {
    return { valid: false, error: '관리자 권한이 없는 계정입니다: ' + email };
  }

  return { valid: true, email: email };
}

/**
 * 학생 Firebase ID 토큰 검증
 */
function verifyStudentAuth(idToken) {
  var props = PropertiesService.getScriptProperties();
  var apiKey = props.getProperty('FIREBASE_API_KEY');

  if (!apiKey) {
    return { valid: false, error: '서버 설정 오류: FIREBASE_API_KEY 스크립트 속성이 누락되었습니다.' };
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
    return { valid: false, error: '토큰 검증 통신 실패: ' + (netErr.message || String(netErr)) };
  }

  if (response.getResponseCode() !== 200) {
    return { valid: false, error: '유효하지 않거나 만료된 학생 토큰입니다. 다시 로그인해 주세요.' };
  }

  var data = JSON.parse(response.getContentText());
  if (!data.users || data.users.length === 0) {
    return { valid: false, error: '학생 사용자 계정을 찾을 수 없습니다.' };
  }

  var user = data.users[0];
  return {
    valid: true,
    uid: user.localId,
    email: (user.email || '').toLowerCase()
  };
}

/**
 * ID 토큰 JWT 페이로드에서 Firebase 프로젝트 ID 추출
 */
function extractProjectId(idToken) {
  try {
    var parts = idToken.split('.');
    if (parts.length >= 2) {
      var decoded = Utilities.newBlob(Utilities.base64DecodeWebSafe(parts[1])).getDataAsString();
      var parsed = JSON.parse(decoded);
      if (parsed.aud) return parsed.aud;
      if (parsed.project_id) return parsed.project_id;
    }
  } catch (e) {
    // 디코딩 실패 시 스크립트 속성 확인
  }
  var props = PropertiesService.getScriptProperties();
  return props.getProperty('FIREBASE_PROJECT_ID') || null;
}

/**
 * Firestore REST API로 학생 응시 세션 문서 읽기
 */
function fetchFirestoreSession(projectId, examId, uid, idToken) {
  var url = 'https://firestore.googleapis.com/v1/projects/' + encodeURIComponent(projectId) +
    '/databases/(default)/documents/exams/' + encodeURIComponent(examId) +
    '/sessions/' + encodeURIComponent(uid);

  var res;
  try {
    res = UrlFetchApp.fetch(url, {
      method: 'get',
      headers: { Authorization: 'Bearer ' + idToken },
      muteHttpExceptions: true
    });
  } catch (err) {
    throw new Error('Firestore 세션 조회 통신 오류: ' + (err.message || String(err)));
  }

  if (res.getResponseCode() === 404) {
    throw new Error('응시 세션 문서가 존재하지 않습니다. 먼저 시험에 올바르게 입장해 주세요.');
  }

  if (res.getResponseCode() !== 200) {
    throw new Error('Firestore 세션 조회 실패 (코드 ' + res.getResponseCode() + ')');
  }

  var doc = JSON.parse(res.getContentText());
  var f = doc.fields || {};

  return {
    studentId: f.studentId ? f.studentId.stringValue : '',
    name: f.name ? f.name.stringValue : '',
    section: f.section ? f.section.stringValue : '',
    enteredAt: f.enteredAt ? f.enteredAt.timestampValue : '',
    individualEndAt: f.individualEndAt ? f.individualEndAt.timestampValue : '',
    tabBlurCount: f.tabBlurCount ? Number(f.tabBlurCount.integerValue || f.tabBlurCount.doubleValue || 0) : 0,
    tabBlurDuration: f.tabBlurDuration ? Number(f.tabBlurDuration.integerValue || f.tabBlurDuration.doubleValue || 0) : 0,
    faceOutCount: f.faceOutCount ? Number(f.faceOutCount.integerValue || f.faceOutCount.doubleValue || 0) : 0,
    faceOutDuration: f.faceOutDuration ? Number(f.faceOutDuration.integerValue || f.faceOutDuration.doubleValue || 0) : 0,
    multipleFacesCount: f.multipleFacesCount ? Number(f.multipleFacesCount.integerValue || f.multipleFacesCount.doubleValue || 0) : 0,
    cameraUsed: f.cameraUsed ? Boolean(f.cameraUsed.booleanValue) : false,
    initialFaceUnverified: f.initialFaceUnverified ? Boolean(f.initialFaceUnverified.booleanValue) : false
  };
}

/**
 * [4-3단계 A안] Firestore REST API로 시험 메타데이터(/exams/{id})의 durationMinutes, closeAt 읽기
 */
function fetchFirestoreExamMeta(projectId, examId, idToken) {
  var url = 'https://firestore.googleapis.com/v1/projects/' + encodeURIComponent(projectId) +
    '/databases/(default)/documents/exams/' + encodeURIComponent(examId);

  try {
    var res = UrlFetchApp.fetch(url, {
      method: 'get',
      headers: { Authorization: 'Bearer ' + idToken },
      muteHttpExceptions: true
    });
    if (res.getResponseCode() === 200) {
      var doc = JSON.parse(res.getContentText());
      var f = doc.fields || {};
      return {
        durationMinutes: f.durationMinutes && f.durationMinutes.integerValue ? Number(f.durationMinutes.integerValue) : 50,
        closeAt: f.closeAt && f.closeAt.timestampValue ? f.closeAt.timestampValue : null
      };
    }
  } catch (e) {
    Logger.log('fetchFirestoreExamMeta note: ' + e);
  }
  return { durationMinutes: 50, closeAt: null };
}

/**
 * Firestore REST API로 접수 완료 문서(/exams/{id}/submissions/{uid}) 생성 시도 (외부 호출)
 */
function createFirestoreSubmissionRecord(projectId, examId, uid, receiptId, nowIso, idToken, submitType) {
  var url = 'https://firestore.googleapis.com/v1/projects/' + encodeURIComponent(projectId) +
    '/databases/(default)/documents/exams/' + encodeURIComponent(examId) +
    '/submissions/' + encodeURIComponent(uid);

  var payload = {
    fields: {
      uid: { stringValue: uid },
      receiptId: { stringValue: receiptId },
      submittedAt: { timestampValue: nowIso },
      submitType: { stringValue: submitType }
    }
  };

  UrlFetchApp.fetch(url, {
    method: 'patch',
    contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + idToken },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });
}

/**
 * 정답표 시트 준비 및 제목줄 상태 점검·자동 복구
 * - 1행이 이전 중복 데이터(1번 문항이 1행과 2행에 중복)인 경우 1행 자동 삭제
 * - 1행에 제목줄('시험ID')이 없으면 1행에 제목줄을 삽입(insertRowBefore)하여 제목줄 보장
 */
function ensureAnswerKeySheet(ss) {
  var sheet = ss.getSheetByName(SHEET_TABS.ANSWER_KEY);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_TABS.ANSWER_KEY);
  }

  var lastRow = sheet.getLastRow();
  if (lastRow === 0) {
    sheet.appendRow(ANSWER_KEY_HEADERS);
    sheet.getRange(1, 1, 1, ANSWER_KEY_HEADERS.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
    return sheet;
  }

  // 1행 1열 확인
  var r1Cell = String(sheet.getRange(1, 1).getValue()).trim();

  // 1행이 제목줄('시험ID')이 아닌 경우
  if (r1Cell !== '시험ID') {
    // 1행과 2행이 모두 1번 문항인지 확인 (과거 구버전 1번 중복 행 케이스 감지)
    if (lastRow >= 2) {
      var r1QNo = Number(sheet.getRange(1, 2).getValue());
      var r2QNo = Number(sheet.getRange(2, 2).getValue());
      if (r1QNo === 1 && r2QNo === 1) {
        Logger.log('1행에 남아있던 구버전 1번 중복 데이터 행을 자동 삭제합니다.');
        sheet.deleteRow(1);
        lastRow = sheet.getLastRow();
      }
    }

    // 1행을 다시 확인하여 여전히 제목줄이 아니면 1행 위에 제목줄 행 삽입
    var currentTop = String(sheet.getRange(1, 1).getValue()).trim();
    if (currentTop !== '시험ID') {
      sheet.insertRowBefore(1);
      sheet.getRange(1, 1, 1, ANSWER_KEY_HEADERS.length).setValues([ANSWER_KEY_HEADERS]);
      sheet.getRange(1, 1, 1, ANSWER_KEY_HEADERS.length).setFontWeight('bold');
      sheet.setFrozenRows(1);
      Logger.log('정답표 1행에 제목줄을 새로 삽입했습니다.');
    }
  } else {
    sheet.getRange(1, 1, 1, ANSWER_KEY_HEADERS.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }

  return sheet;
}

/**
 * 응시결과 시트 준비 및 제목줄 상태 점검·자동 복구
 */
function ensureSubmissionsSheet(ss) {
  var sheet = ss.getSheetByName(SHEET_TABS.SUBMISSIONS);
  if (!sheet) {
    var allSheets = ss.getSheets();
    for (var s = 0; s < allSheets.length; s++) {
      if (allSheets[s].getName().replace(/\s+/g, '') === '응시결과') {
        sheet = allSheets[s];
        break;
      }
    }
  }
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_TABS.SUBMISSIONS);
  }

  var lastRow = sheet.getLastRow();
  if (lastRow === 0) {
    sheet.appendRow(SUBMISSION_HEADERS);
    sheet.getRange(1, 1, 1, SUBMISSION_HEADERS.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
    return sheet;
  }

  var currentTop = String(sheet.getRange(1, 1).getValue()).trim();
  if (currentTop !== '시험ID') {
    sheet.insertRowBefore(1);
    sheet.getRange(1, 1, 1, SUBMISSION_HEADERS.length).setValues([SUBMISSION_HEADERS]);
    sheet.getRange(1, 1, 1, SUBMISSION_HEADERS.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
    Logger.log('응시결과 1행에 제목줄을 새로 삽입했습니다.');
  } else {
    sheet.getRange(1, 1, 1, SUBMISSION_HEADERS.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }

  return sheet;
}

/**
 * Apps Script 편집기 상단에서 직접 선택하여 [▶ 실행]할 수 있는 원클릭 정돈 함수
 */
function repairSheetHeaders() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var ansSheet = ensureAnswerKeySheet(ss);
  var subSheet = ensureSubmissionsSheet(ss);
  Logger.log('정답표(총 ' + ansSheet.getLastRow() + '행) 및 응시결과(총 ' + subSheet.getLastRow() + '행) 정돈 완료.');
}

/**
 * [정답표] 탭에서 정답 매핑 읽기
 * - 1행이 제목줄이면 2행부터, 1행이 데이터면 1행부터 읽음
 * - 같은 문항 번호가 2번 이상 있으면 채점을 중단하고 "정답표 중복" 오류 반환
 */
function getAnswerKeyMap(ss, examId) {
  var sheet = ss.getSheetByName(SHEET_TABS.ANSWER_KEY);
  if (!sheet) {
    throw new Error('정답표 시트(' + SHEET_TABS.ANSWER_KEY + ')를 찾을 수 없습니다.');
  }

  var lastRow = sheet.getLastRow();
  if (lastRow <= 0) {
    throw new Error('정답표 시트에 데이터가 없습니다. 먼저 관리자 화면에서 문항을 확정해 주세요.');
  }

  var firstCell = String(sheet.getRange(1, 1).getValue()).trim();
  var startRow = 1;
  if (firstCell === '시험ID') {
    startRow = 2; // 1행이 제목줄인 경우
  } else {
    Logger.log('경고: 정답표 1행이 제목줄이 아닙니다: ' + firstCell);
    startRow = 1; // 1행이 데이터인 경우 1행부터 읽음
  }

  var rowCount = lastRow - startRow + 1;
  if (rowCount <= 0) {
    throw new Error('정답표 시트에 문항 데이터가 없습니다. 먼저 관리자 화면에서 문항을 확정해 주세요.');
  }

  var values = sheet.getRange(startRow, 1, rowCount, 5).getValues();
  var map = {};
  var duplicateNos = [];
  var found = false;

  for (var i = 0; i < values.length; i++) {
    var rExamId = String(values[i][0]).trim();
    if (rExamId === examId) {
      found = true;
      var qNo = Number(values[i][1]);
      if (isNaN(qNo) || qNo <= 0) {
        continue;
      }

      // [요구사항 3] 같은 문항 번호가 두 번 이상 있으면 채점을 멈추고 "정답표 중복" 오류를 기록/반환
      if (map[qNo] !== undefined) {
        if (duplicateNos.indexOf(qNo) === -1) {
          duplicateNos.push(qNo);
        }
      }

      var ans = Number(values[i][2]);
      var domain = String(values[i][3]).trim();
      var level = String(values[i][4]).trim();
      map[qNo] = { answer: ans, domain: domain, level: level };
    }
  }

  if (!found) {
    throw new Error('해당 시험ID(' + examId + ')의 확정된 정답표를 찾을 수 없습니다.');
  }

  if (duplicateNos.length > 0) {
    duplicateNos.sort(function(a, b) { return a - b; });
    var dupErrMsg = '정답표 중복 오류: [' + examId + '] 정답표에 중복된 문항 번호가 존재합니다 (' + duplicateNos.join(', ') + '번). 정답표 시트를 확인하거나 관리자 화면에서 문항을 다시 확정해 주세요.';
    Logger.log('오류: ' + dupErrMsg);
    throw new Error(dupErrMsg);
  }

  return map;
}

/**
 * [관리자 전용] 시험 미리보기 정답 번호 조회
 * - doPost의 getPreviewAnswerKey 라우트에서 관리자 토큰 검증을 통과한 뒤에만 호출
 * - 학생용 문항, 해설, 출처는 반환하지 않고 문항번호별 정답 번호만 반환
 */
function getPreviewAnswerKey(examId) {
  if (!examId || typeof examId !== 'string') {
    return createJsonResponse({ success: false, error: '시험ID(examId)가 올바르지 않습니다.' });
  }

  var answerKeyMap = getAnswerKeyMap(SpreadsheetApp.getActiveSpreadsheet(), examId);
  var answers = {};
  Object.keys(answerKeyMap).forEach(function(qNo) {
    answers[qNo] = answerKeyMap[qNo].answer;
  });

  return createJsonResponse({
    success: true,
    examId: examId,
    answers: answers
  });
}

/**
 * 날짜 포맷팅 (Asia/Seoul)
 */
function formatDateTime(dateObj) {
  return Utilities.formatDate(dateObj, 'Asia/Seoul', 'yyyy.MM.dd HH:mm:ss');
}

/**
 * 4-2단계: 시험 답안 채점 및 응시결과 시트 기록
 * - 잠금 밖: 토큰 확인, Firestore 세션 읽기, 정답표 대조 및 채점
 * - 잠금 안: 중복 확인(시험ID + UID) 및 행 추가
 * - 잠금 밖: Firestore 접수 완료 문서 기록 및 응답 반환
 */
function submitExam(payload) {
  var idToken = payload.idToken;
  var examId = String(payload.examId || '').trim();
  var studentAnswers = payload.answers || {};
  var submitType = payload.submitType || 'manual';

  if (!examId) {
    return createJsonResponse({ success: false, error: '시험ID(examId)가 누락되었습니다.' });
  }

  // --- 1. 잠금 밖: 토큰 검증 및 학생 확인 ---
  var authResult = verifyStudentAuth(idToken);
  if (!authResult.valid) {
    return createJsonResponse({ success: false, error: authResult.error });
  }
  var uid = authResult.uid;

  // --- 2. 잠금 밖: Firestore REST로 세션 문서 조회 (학번, 성명, 분반, 종료시각) ---
  var projectId = extractProjectId(idToken);
  if (!projectId) {
    return createJsonResponse({ success: false, error: 'Firebase 프로젝트 ID를 파악할 수 없습니다.' });
  }

  var sessionData;
  try {
    sessionData = fetchFirestoreSession(projectId, examId, uid, idToken);
  } catch (err) {
    return createJsonResponse({ success: false, error: err.message || String(err) });
  }

  var studentId = sessionData.studentId;
  var studentName = sessionData.name;
  var section = sessionData.section;
  var individualEndAtIso = sessionData.individualEndAt;

  // --- 3. 잠금 밖: 제출 시각 및 지연 판정 (4-3단계 A안: min(enteredAt + 제한시간, closeAt)) ---
  var serverNow = new Date();
  var serverNowIso = serverNow.toISOString();
  var formattedSubmittedAt = formatDateTime(serverNow);

  var isDelayed = false;
  var calculatedEndAtMs = 0;

  if (individualEndAtIso) {
    calculatedEndAtMs = new Date(individualEndAtIso).getTime();
  } else if (sessionData.enteredAt) {
    var examMeta = fetchFirestoreExamMeta(projectId, examId, idToken);
    var enteredTime = new Date(sessionData.enteredAt).getTime();
    var durationMs = (examMeta.durationMinutes || 50) * 60 * 1000;
    calculatedEndAtMs = enteredTime + durationMs;

    if (examMeta.closeAt) {
      var closeAtTime = new Date(examMeta.closeAt).getTime();
      if (closeAtTime < calculatedEndAtMs) {
        calculatedEndAtMs = closeAtTime;
      }
    }
  }

  if (calculatedEndAtMs > 0) {
    var graceMs = 2 * 60 * 1000; // 네트워크 지연 고려 2분 여유
    if (serverNow.getTime() > (calculatedEndAtMs + graceMs)) {
      isDelayed = true;
    }
  }

  var finalSubmitType = isDelayed ? '지연 제출' : (submitType === 'auto' ? '자동' : '직접');

  // --- 4. 잠금 밖: 정답표 대조 및 채점 ---
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var answerKeyMap;
  try {
    answerKeyMap = getAnswerKeyMap(ss, examId);
  } catch (err) {
    return createJsonResponse({ success: false, error: err.message || String(err) });
  }

  var correctCount = 0;
  var wrongQuestionNos = [];
  var domainTotals = {};
  var domainCorrects = {};

  for (var d = 0; d < DOMAINS.length; d++) {
    domainTotals[DOMAINS[d]] = 0;
    domainCorrects[DOMAINS[d]] = 0;
  }

  // 1~40번 채점
  for (var qn = 1; qn <= 40; qn++) {
    var key = answerKeyMap[qn];
    var studentChoice = (studentAnswers[qn] !== undefined && studentAnswers[qn] !== null)
      ? Number(studentAnswers[qn])
      : null;

    if (key) {
      if (domainTotals[key.domain] !== undefined) {
        domainTotals[key.domain]++;
      }
      if (studentChoice !== null && studentChoice === key.answer) {
        correctCount++;
        if (domainCorrects[key.domain] !== undefined) {
          domainCorrects[key.domain]++;
        }
      } else {
        wrongQuestionNos.push(qn);
      }
    } else {
      if (studentChoice === null) {
        wrongQuestionNos.push(qn);
      }
    }
  }

  var totalScore = correctCount * 2.5; // 문항당 2.5점 (100점 만점)
  var receiptId = 'REC-' + examId + '-' + (studentId || uid.substring(0, 8));

  // 추가할 행 데이터 (57개 열)
  var newRow = [
    examId,
    formattedSubmittedAt,
    receiptId,
    studentId,
    studentName,
    section,
    uid
  ];

  // 1~40번 응답 기록
  for (var i = 1; i <= 40; i++) {
    var ans = (studentAnswers[i] !== undefined && studentAnswers[i] !== null)
      ? studentAnswers[i]
      : '미응답';
    newRow.push(ans);
  }

  // 채점 요약
  newRow.push(wrongQuestionNos.length > 0 ? wrongQuestionNos.join(', ') : '없음(만점)');
  newRow.push(totalScore);

  // 5개 영역별 성취도(%)
  for (var di = 0; di < DOMAINS.length; di++) {
    var domName = DOMAINS[di];
    var tot = domainTotals[domName] || 0;
    var cor = domainCorrects[domName] || 0;
    var pct = tot > 0 ? ((cor / tot) * 100).toFixed(1) + '%' : '0.0%';
    newRow.push(pct);
  }

  // 6단계 보조 장치 기록 (Firestore 세션 문서 공인 값)
  var cameraUsed = Boolean(sessionData.cameraUsed);
  var faceOutCount = cameraUsed ? (sessionData.faceOutCount || 0) : 0;
  var faceOutDuration = cameraUsed ? (sessionData.faceOutDuration || 0) : '미동의';

  newRow.push(faceOutCount);     // 55열 (BC열): 카메라 이탈 횟수
  newRow.push(faceOutDuration);  // 56열 (BD열): 카메라 이탈 누적시간(초) (미동의 시 '미동의')

  // 제출 방식
  newRow.push(finalSubmitType);  // 57열 (BE열): 제출 방식

  // --- 5. 잠금 안: 중복 확인(시험ID + UID) 및 행 추가 ---
  var lock = LockService.getScriptLock();
  var hasLock = lock.tryLock(30000);
  if (!hasLock) {
    return createJsonResponse({
      success: false,
      error: '서버가 혼잡하여 접수를 처리하지 못했습니다. 답안은 안전하게 보관되어 있으니 잠시 후 자동으로 재시도합니다.'
    });
  }

  var existingResult = null;
  try {
    var subSheet = ensureSubmissionsSheet(ss);
    var lastRow = subSheet.getLastRow();
    if (lastRow > 1) {
      var existingData = subSheet.getRange(2, 1, lastRow - 1, 7).getValues();
      for (var r = 0; r < existingData.length; r++) {
        var rExamId = String(existingData[r][0]).trim();
        var rSubmittedAt = existingData[r][1];
        var rReceiptId = String(existingData[r][2]).trim();
        var rUid = String(existingData[r][6]).trim();

        if (rExamId === examId && rUid === uid) {
          existingResult = {
            receiptId: rReceiptId,
            submittedAt: rSubmittedAt instanceof Date ? formatDateTime(rSubmittedAt) : String(rSubmittedAt)
          };
          break;
        }
      }
    }

    if (!existingResult) {
      subSheet.appendRow(newRow);
    }
  } finally {
    lock.releaseLock();
  }

  // 이미 제출된 요청인 경우 기존 접수 정보 반환 (멱등성 보장)
  if (existingResult) {
    return createJsonResponse({
      success: true,
      receiptId: existingResult.receiptId,
      submittedAt: existingResult.submittedAt,
      message: '이미 접수 완료된 시험입니다.'
    });
  }

  // --- 6. 잠금 밖: Firestore 접수 완료 문서 기록 (최선 노력) ---
  try {
    createFirestoreSubmissionRecord(projectId, examId, uid, receiptId, serverNowIso, idToken, finalSubmitType);
  } catch (fsErr) {
    Logger.log('Firestore submission record creation note: ' + fsErr);
  }

  // --- 7. 응답 반환: 점수와 정답은 제외하고 접수번호와 제출시각만 반환 ---
  return createJsonResponse({
    success: true,
    receiptId: receiptId,
    submittedAt: formattedSubmittedAt
  });
}

/**
 * [보조 함수] '삭제기록' 시트 확보 (없으면 생성 및 헤더 초기화)
 */
function ensureDeletedArchiveSheet(ss) {
  var sheet = ss.getSheetByName(SHEET_TABS.DELETED_ARCHIVE);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_TABS.DELETED_ARCHIVE);
    var archiveHeaders = SUBMISSION_HEADERS.slice();
    archiveHeaders.push('삭제일시');
    sheet.appendRow(archiveHeaders);
    sheet.getRange(1, 1, 1, archiveHeaders.length).setFontWeight('bold').setBackground('#fee2e2');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

/**
 * [관리자 전용] 해당 시험의 응시 결과 행 초기화 (개별 또는 전체)
 * - 개별 리셋: targetUid가 지정되면 해당 학생의 행을 찾아 '삭제기록' 탭으로 이동하고 '응시결과'에서 삭제
 * - 전체 리셋: targetUid가 없으면 2행부터의 모든 데이터 행을 '삭제기록' 탭으로 이동하고 '응시결과'에서 삭제
 */
function resetSubmissions(examId, targetUid) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ensureSubmissionsSheet(ss);
  var archiveSheet = ensureDeletedArchiveSheet(ss);
  var lastRow = sheet.getLastRow();
  var deletedCount = 0;
  var nowStr = formatDateTime(new Date());

  if (lastRow <= 1) {
    return createJsonResponse({
      success: true,
      message: '응시결과 시트에 삭제할 데이터 행이 없습니다.',
      deletedCount: 0
    });
  }

  var numCols = sheet.getLastColumn();
  var dataRange = sheet.getRange(2, 1, lastRow - 1, numCols);
  var values = dataRange.getValues();

  if (targetUid) {
    // 개별 학생 리셋: UID (7열, 0-index: 6) 일치 행 찾아서 삭제기록으로 이동
    for (var i = values.length - 1; i >= 0; i--) {
      var rowExamId = String(values[i][0]).trim();
      var rowUid = String(values[i][6]).trim();
      if ((!examId || rowExamId === examId) && rowUid === targetUid) {
        var rowData = values[i].slice();
        rowData.push(nowStr);
        archiveSheet.appendRow(rowData);
        sheet.deleteRow(i + 2); // 1-index, 헤더가 1행이므로 데이터는 2행부터
        deletedCount++;
      }
    }
    Logger.log('학생(' + targetUid + ')의 응시결과 행을 [삭제기록] 탭으로 이동했습니다.');
  } else {
    // 전체 리셋: 모든 데이터 행을 [삭제기록] 탭으로 복사 후 일괄 삭제
    var archiveRows = [];
    for (var j = 0; j < values.length; j++) {
      var fullRow = values[j].slice();
      fullRow.push(nowStr);
      archiveRows.push(fullRow);
    }
    if (archiveRows.length > 0) {
      archiveSheet.getRange(archiveSheet.getLastRow() + 1, 1, archiveRows.length, archiveRows[0].length).setValues(archiveRows);
    }
    deletedCount = lastRow - 1;
    sheet.deleteRows(2, deletedCount);
    Logger.log('응시결과 시트의 모든 데이터 행(' + deletedCount + '개)을 [삭제기록] 탭으로 이동 후 삭제했습니다.');
  }

  return createJsonResponse({
    success: true,
    message: targetUid
      ? '학생(' + targetUid + ')의 응시결과가 [삭제기록] 탭으로 안전하게 이동되었습니다.'
      : '응시결과 시트의 ' + deletedCount + '개 행이 [삭제기록] 탭으로 이동 후 초기화되었습니다.',
    deletedCount: deletedCount
  });
}

/**
 * Apps Script 편집기 상단 드롭다운에서 직접 선택해 [▶ 실행]할 수 있는 원클릭 응시결과 시트 초기화 함수
 */
function resetSubmissionsFromEditor() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ensureSubmissionsSheet(ss);
  var lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.deleteRows(2, lastRow - 1);
    Logger.log('응시결과 시트의 모든 데이터 행(' + (lastRow - 1) + '개)을 즉시 삭제했습니다.');
  } else {
    Logger.log('응시결과 시트에 삭제할 데이터 행이 없습니다.');
  }
}

/**
 * 문항 확정 및 정답표 시트 저장
 * - 1행 포함 해당 시험ID의 모든 데이터 행을 삭제 후 새 데이터로 교체 (제목줄 제외)
 * - 1행이 비어 있으면 제목줄 작성, 1행이 제목줄이 아니면 경고 기록
 */
function finalizeExam(examId, examPackage, adminEmail) {
  if (!examId || typeof examId !== 'string') {
    return createJsonResponse({ success: false, error: '시험ID(examId)가 올바르지 않습니다.' });
  }

  if (!examPackage || !Array.isArray(examPackage.questions) || examPackage.questions.length === 0) {
    return createJsonResponse({ success: false, error: '확정할 문항 데이터가 없습니다.' });
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ensureAnswerKeySheet(ss);

  var lastRow = sheet.getLastRow();
  // [요구사항 2] 같은 시험ID를 다시 확정할 때 해당 시험ID의 모든 행(1행 포함, 제목줄 제외)을 교체
  if (lastRow >= 1) {
    var examIdColumnValues = sheet.getRange(1, 1, lastRow, 1).getValues();
    // 1행까지 역순 순회
    for (var r = examIdColumnValues.length - 1; r >= 0; r--) {
      var rowNum = r + 1; // 1-based row index
      var val = String(examIdColumnValues[r][0]).trim();
      if (val === examId) {
        // 단, 1행이 정확히 '시험ID' 제목줄인 경우는 제외
        if (rowNum === 1 && val === '시험ID') {
          continue;
        }
        sheet.deleteRow(rowNum);
      }
    }
  }

  // 기존 행 삭제 후 시트가 비었거나 제목줄이 없으면 제목줄 작성
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(ANSWER_KEY_HEADERS);
    sheet.getRange(1, 1, 1, ANSWER_KEY_HEADERS.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  } else {
    var topCell = String(sheet.getRange(1, 1).getValue()).trim();
    if (topCell !== '시험ID') {
      Logger.log('경고: [' + SHEET_TABS.ANSWER_KEY + '] 탭의 1행이 제목줄이 아닙니다: ' + topCell);
    }
  }

  var sortedQuestions = examPackage.questions.slice().sort(function(a, b) {
    return a.no - b.no;
  });

  var rowsToInsert = [];
  var nowIso = new Date().toISOString();

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
 * JSON 응답 생성 헬퍼
 */
function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
