let currentQuestionIndex = 0;
let score = 0;
let questions = [];
let currentDifficulty = 0; // 0: 전체, 1: 기초, 2: 응용, 3: 실전

// 효과음 파일 (무료 소스)
const correctSound = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-arcade-retro-changing-tab-206.mp3');
const wrongSound = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-wrong-answer-fail-notification-946.mp3');

// 메인 화면으로 돌아가기
function goHome() {
    document.getElementById('menu-screen').classList.remove('hidden');
    document.getElementById('quiz-screen').classList.add('hidden');
    document.getElementById('wrong-screen').classList.add('hidden');
    document.getElementById('result-screen').classList.add('hidden');
    currentQuestionIndex = 0;
    score = 0;
}

// 퀴즈 시작하기 (난이도 필터링 추가)
async function startQuiz(fileName, difficultyLevel = 0) {
    // 화면 전환
    document.getElementById('menu-screen').classList.add('hidden');
    document.getElementById('quiz-screen').classList.remove('hidden');

    try {
        const response = await fetch(`data/${fileName}`);
        if (!response.ok) throw new Error(`파일을 찾을 수 없음: data/${fileName}`);

        const allQuestions = await response.json();

        // 난이도 필터링 (0이면 전체)
        if (difficultyLevel > 0) {
            questions = allQuestions.filter(q => q.difficulty === difficultyLevel);
            // 만약 해당 난이도 문제가 하나도 없으면 전체 문제로 대체
            if (questions.length === 0) {
                alert("아직 해당 난이도의 문제가 준비되지 않았습니다. 전체 문제로 시작합니다!");
                questions = allQuestions;
            }
        } else {
            questions = allQuestions;
        }

        // 문제 섞기
        questions.sort(() => Math.random() - 0.5);

        loadQuestion();
    } catch (error) {
        console.error("상세 에러 로그:", error);
        alert("🛑 에러 발생!\n" +
            "이름: " + error.name + "\n" +
            "내용: " + error.message);
        goHome();
    }
}

function loadQuestion() {
    const questionData = questions[currentQuestionIndex];

    // 난이도 별 아이콘/텍스트 설정
    let difficultyBadge = "";
    if (questionData.difficulty === 1) difficultyBadge = "<span style='color:#58cc02'>[기초]</span>";
    else if (questionData.difficulty === 2) difficultyBadge = "<span style='color:#f4a261'>[응용]</span>";
    else if (questionData.difficulty === 3) difficultyBadge = "<span style='color:#e76f51'>[실전]</span>";
    else difficultyBadge = ""; // 난이도 정보가 없는 경우

    // 카테고리와 난이도 함께 표시
    document.getElementById('category-tag').innerHTML = `${difficultyBadge} ${questionData.category || "Quiz"}`;

    document.getElementById('question-text').innerText = questionData.question;
    document.getElementById('feedback-area').classList.add('hidden');

    // 프로그레스 바 업데이트
    let progressPercent = (currentQuestionIndex / questions.length) * 100;
    if (progressPercent < 5) progressPercent = 5;
    document.getElementById('progress-fill').style.width = `${progressPercent}%`;

    const optionsContainer = document.getElementById('options-container');
    optionsContainer.innerHTML = '';

    questionData.options.forEach((optionText, index) => {
        const button = document.createElement('button');
        button.innerText = optionText;
        button.classList.add('option-btn');
        button.onclick = () => checkAnswer(index, questionData.answer);
        optionsContainer.appendChild(button);
    });
}
function checkAnswer(selectedIndex, correctIndex) {
    const optionsContainer = document.getElementById('options-container');
    const buttons = optionsContainer.getElementsByClassName('option-btn');

    for (let btn of buttons) btn.disabled = true;

    if (selectedIndex === correctIndex) {
        // 정답
        buttons[selectedIndex].classList.add('correct');
        document.getElementById('feedback-title').innerText = "정답! 🎉";
        document.getElementById('feedback-title').style.color = "#58cc02";
        score++;
        correctSound.volume = 0.5;
correctSound.play().catch((e) => { console.log("소리 재생 실패:", e); });
    } else {
        // 오답
        buttons[selectedIndex].classList.add('wrong');
        buttons[correctIndex].classList.add('correct');
        document.getElementById('feedback-title').innerText = "땡! 😅";
        document.getElementById('feedback-title').style.color = "#ff4b4b";
        wrongSound.volume = 0.3;
        wrongSound.play().catch(() => { });

        // 오답 노트 저장
        saveWrongAnswer(questions[currentQuestionIndex]);
    }

    document.getElementById('feedback-text').innerText = questions[currentQuestionIndex].explanation;
    document.getElementById('feedback-area').classList.remove('hidden');
    document.getElementById('next-btn').onclick = nextQuestion;
}

// 오답 저장 함수
function saveWrongAnswer(questionObj) {
    let wrongNotes = JSON.parse(localStorage.getItem('cs-tutor-wrong')) || [];

    // 이미 저장된 문제인지 확인 (중복 방지)
    const exists = wrongNotes.find(q => q.id === questionObj.id);
    if (!exists) {
        wrongNotes.push(questionObj);
        localStorage.setItem('cs-tutor-wrong', JSON.stringify(wrongNotes));
    }
}

function nextQuestion() {
    currentQuestionIndex++;
    if (currentQuestionIndex < questions.length) {
        loadQuestion();
    } else {
        showResult();
    }
}

// 결과 보여주기 함수 (HTML 덮어쓰기 -> 화면 전환으로 변경)
function showResult() {
    document.getElementById('quiz-screen').classList.add('hidden');
    document.getElementById('result-screen').classList.remove('hidden');

    const msg = `총 ${questions.length}문제 중 <strong>${score}</strong>개를 맞췄어요.`;
    document.getElementById('result-message').innerHTML = msg;
}

// 같은 과목 다시 풀기
function restartQuiz() {
    currentQuestionIndex = 0;
    score = 0;
    document.getElementById('result-screen').classList.add('hidden');
    document.getElementById('quiz-screen').classList.remove('hidden');
    questions.sort(() => Math.random() - 0.5); // 다시 섞기
    loadQuestion();
}

// 오답 노트 화면 열기
function openWrongNote() {
    document.getElementById('menu-screen').classList.add('hidden');
    document.getElementById('quiz-screen').classList.add('hidden');
    document.getElementById('wrong-screen').classList.remove('hidden');

    renderWrongNotes();
}

// 오답 리스트 화면에 그리기
function renderWrongNotes() {
    const listContainer = document.getElementById('wrong-list');
    const wrongNotes = JSON.parse(localStorage.getItem('cs-tutor-wrong')) || [];

    // 목록 초기화
    listContainer.innerHTML = '';

    if (wrongNotes.length === 0) {
        listContainer.innerHTML = '<div class="empty-message">틀린 문제가 없습니다.<br>완벽하시군요! 😎</div>';
        return;
    }

    // 최신순으로 정렬 (뒤집기)
    wrongNotes.reverse().forEach((q, index) => {
        // 실제 인덱스 (삭제할 때 필요)
        const realIndex = wrongNotes.length - 1 - index;

        const card = document.createElement('div');
        card.className = 'wrong-card';

        // 정답 텍스트 찾기
        const correctAnsText = q.options[q.answer];

        card.innerHTML = `
            <div class="tag">${q.category || '일반'}</div>
            <button class="delete-btn" onclick="deleteWrongNote(${realIndex})">×</button>
            <h3>${q.question}</h3>
            <p style="font-size: 0.9rem; color: #555;">정답: <span class="answer-text">${correctAnsText}</span></p>
            <p style="font-size: 0.85rem; color: #888; margin-top:5px;">💡 ${q.explanation}</p>
        `;
        listContainer.appendChild(card);
    });
}

// 오답 삭제하기
function deleteWrongNote(index) {
    let wrongNotes = JSON.parse(localStorage.getItem('cs-tutor-wrong')) || [];

    if (confirm("이 오답 기록을 삭제할까요?")) {
        wrongNotes.splice(index, 1); // 배열에서 해당 항목 삭제
        localStorage.setItem('cs-tutor-wrong', JSON.stringify(wrongNotes));
        renderWrongNotes(); // 화면 다시 그리기
    }
}

// 오답 노트 전체 초기화 (Reset)
function clearWrongNotes() {
    const wrongNotes = JSON.parse(localStorage.getItem('cs-tutor-wrong')) || [];

    if (wrongNotes.length === 0) {
        alert("지울 오답이 없습니다!");
        return;
    }

    if (confirm("정말로 오답 노트를 전부 비우시겠습니까?\n(삭제된 내용은 복구할 수 없습니다)")) {
        localStorage.removeItem('cs-tutor-wrong'); // 저장소 비우기
        renderWrongNotes(); // 화면 즉시 갱신
        alert("오답 노트가 초기화되었습니다.");
    }
}

// 팝업 관련 변수
let selectedFile = ""; // 사용자가 누른 과목 파일명 저장

// 팝업 열기 (HTML 버튼에서 호출)
function openLevelPopup(fileName, subjectName) {
    console.log("팝업 열기 시도:", fileName); // [디버깅] 파일명 확인
    selectedFile = fileName; // 파일명 저장해두기
    document.getElementById('popup-title').innerText = subjectName; // 제목 바꾸기
    document.getElementById('level-popup').classList.remove('hidden');
}

// 팝업 닫기
function closeLevelPopup() {
    document.getElementById('level-popup').classList.add('hidden');
    selectedFile = "";
}

// 난이도 선택 완료 -> 퀴즈 시작
function confirmStart(difficulty) {
    console.log("선택된 파일:", selectedFile); // [디버깅] 저장된 파일명 확인
    if (!selectedFile) return;
    const fileToStart = selectedFile; // 지역 변수에 복사

    closeLevelPopup(); // 팝업 닫고
    startQuiz(fileToStart, difficulty); // 진짜 퀴즈 시작 (기존 함수 재활용)
}