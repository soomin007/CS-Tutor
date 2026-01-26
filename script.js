let currentQuestionIndex = 0;
let score = 0;
let questions = [];

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
        buttons[selectedIndex].classList.add('correct');
        document.getElementById('feedback-title').innerText = "정답! 🎉";
        document.getElementById('feedback-title').style.color = "#58cc02";
        score++;
    } else {
        buttons[selectedIndex].classList.add('wrong');
        buttons[correctIndex].classList.add('correct');
        document.getElementById('feedback-title').innerText = "오답 😅";
        document.getElementById('feedback-title').style.color = "#ff4b4b";
    }

    document.getElementById('feedback-text').innerText = questions[currentQuestionIndex].explanation;
    document.getElementById('feedback-area').classList.remove('hidden');
    document.getElementById('next-btn').onclick = nextQuestion;
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