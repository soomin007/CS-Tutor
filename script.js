let currentQuestionIndex = 0;
let score = 0;
let questions = [];

// 효과음 파일 (무료 소스)
const correctSound = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-arcade-retro-changing-tab-206.mp3');
const wrongSound = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-wrong-answer-fail-notification-946.mp3');

// 메인 화면으로 돌아가기
function goHome() {
    document.getElementById('menu-screen').classList.remove('hidden');
    document.getElementById('quiz-screen').classList.add('hidden');
    document.getElementById('wrong-screen').classList.add('hidden'); // 이 줄 추가됨
    currentQuestionIndex = 0;
    score = 0;
}

// 퀴즈 시작하기
async function startQuiz(fileName) {
    // 화면 전환
    document.getElementById('menu-screen').classList.add('hidden');
    document.getElementById('quiz-screen').classList.remove('hidden');
    
    // 데이터 불러오기
    try {
        const response = await fetch(`data/${fileName}`);
        
        // 파일이 없는 경우 에러 처리
        if (!response.ok) {
            throw new Error(`파일을 찾을 수 없음: data/${fileName}`);
        }
        
        questions = await response.json();
        
        // 문제 섞기
        questions.sort(() => Math.random() - 0.5);
        
        loadQuestion();
    } catch (error) {
        console.error("데이터 로딩 실패:", error);
        alert(`오류 발생! JSON 파일을 확인해주세요.\n(에러 내용: ${error.message})`);
        goHome();
    }
}

function loadQuestion() {
    const questionData = questions[currentQuestionIndex];
    
    document.getElementById('category-tag').innerText = questionData.category || "Quiz";
    document.getElementById('question-text').innerText = questionData.question;
    document.getElementById('feedback-area').classList.add('hidden');
    
    // 프로그레스 바 업데이트 (최소 5%는 보이게)
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
        correctSound.play().catch(() => {}); // 소리 재생 에러 무시
    } else {
        // 오답
        buttons[selectedIndex].classList.add('wrong');
        buttons[correctIndex].classList.add('correct');
        document.getElementById('feedback-title').innerText = "땡! 😅";
        document.getElementById('feedback-title').style.color = "#ff4b4b";
        wrongSound.volume = 0.3;
        wrongSound.play().catch(() => {});
        
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

function showResult() {
    const quizBox = document.getElementById('quiz-box');
    quizBox.innerHTML = `
        <div style="text-align: center; padding: 40px;">
            <h1>🎉 완주 성공!</h1>
            <p>총 ${questions.length}문제 중 <strong>${score}</strong>개를 맞췄어요.</p>
            <button onclick="goHome()" style="margin-top:20px; padding:15px 30px; background:#58cc02; color:white; border:none; border-radius:12px; font-weight:bold; cursor:pointer;">다른 과목 도전하기</button>
            <button onclick="location.reload()" style="margin-top:10px; padding:15px 30px; background:#fff; color:#555; border:1px solid #ddd; border-radius:12px; font-weight:bold; cursor:pointer;">다시 풀기</button>
        </div>
    `;
}

// --- script.js 맨 아래에 추가 ---

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