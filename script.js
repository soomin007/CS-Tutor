let currentQuestionIndex = 0;
let score = 0;
let questions = [];

const correctSound = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-arcade-retro-changing-tab-206.mp3');
const wrongSound = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-wrong-answer-fail-notification-946.mp3');

// 메인 화면으로 돌아가기
function goHome() {
    document.getElementById('menu-screen').classList.remove('hidden');
    document.getElementById('quiz-screen').classList.add('hidden');
    currentQuestionIndex = 0;
    score = 0;
}

// 퀴즈 시작하기 (파일 이름을 인자로 받음)
async function startQuiz(fileName) {
    // 화면 전환
    document.getElementById('menu-screen').classList.add('hidden');
    document.getElementById('quiz-screen').classList.remove('hidden');
    
    // 데이터 불러오기
    try {
        // data 폴더 안에 있는 파일을 찾습니다.
        const response = await fetch(`data/${fileName}`);
        if (!response.ok) throw new Error("파일을 찾을 수 없음");
        questions = await response.json();
        
        // 문제 섞기 (매번 순서 다르게)
        questions.sort(() => Math.random() - 0.5);
        
        loadQuestion();
    } catch (error) {
        console.error(error);
        alert("아직 준비 중인 과목입니다! (JSON 파일을 data 폴더에 만들어주세요)");
        goHome();
    }
}

function loadQuestion() {
    const questionData = questions[currentQuestionIndex];
    
    document.getElementById('category-tag').innerText = questionData.category || "Quiz";
    document.getElementById('question-text').innerText = questionData.question;
    document.getElementById('feedback-area').classList.add('hidden');
    
    // 프로그레스 바
    const progressPercent = ((currentQuestionIndex) / questions.length) * 100;
    if (progressPercent < 5) progressPercent = 5; // 최소 너비 설정
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

    // 버튼 잠금
    for (let btn of buttons) btn.disabled = true;

    if (selectedIndex === correctIndex) {
        // 정답 처리
        buttons[selectedIndex].classList.add('correct');
        document.getElementById('feedback-title').innerText = "정답! 🎉";
        document.getElementById('feedback-title').style.color = "#58cc02";
        score++;
        
        // 소리 재생 (크롬 정책상 사용자 인터랙션 후 재생 가능)
        correctSound.volume = 0.5;
        correctSound.play().catch(e => console.log("소리 재생 차단됨")); // 에러 방지
        
    } else {
        // 오답 처리
        buttons[selectedIndex].classList.add('wrong');
        buttons[correctIndex].classList.add('correct'); // 정답 알려주기
        document.getElementById('feedback-title').innerText = "땡! 😅";
        document.getElementById('feedback-title').style.color = "#ff4b4b";
        
        wrongSound.volume = 0.3;
        wrongSound.play().catch(e => console.log("소리 재생 차단됨"));

        // [기능 추가] 오답 노트에 저장 (localStorage)
        saveWrongAnswer(questions[currentQuestionIndex]);
    }

    document.getElementById('feedback-text').innerText = questions[currentQuestionIndex].explanation;
    document.getElementById('feedback-area').classList.remove('hidden');

    document.getElementById('next-btn').onclick = nextQuestion;
}

// [기능 추가] 오답 저장 함수
function saveWrongAnswer(questionObj) {
    // 기존 오답 목록 불러오기 (없으면 빈 배열)
    let wrongNotes = JSON.parse(localStorage.getItem('cs-tutor-wrong')) || [];
    
    // 이미 저장된 문제인지 확인 (중복 방지)
    const exists = wrongNotes.find(q => q.id === questionObj.id);
    if (!exists) {
        wrongNotes.push(questionObj);
        localStorage.setItem('cs-tutor-wrong', JSON.stringify(wrongNotes));
        console.log("오답 노트에 저장됨:", questionObj.question);
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