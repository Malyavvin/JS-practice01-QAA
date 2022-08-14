function createModal(title, content){
    const modal = document.createElement('div')
    modal.classList.add('modal')
    
    modal.innerHTML = `
        <h1>${title}</h1>
        <div class="modal-content">${content}</div>
        `
        
        mui.overlay('on',modal)
}

function openModal(){
    createModal('Авторизация',getAuthForm())
    document.getElementById('auth-form').addEventListener('submit',authFormHandler, {once : true })
}
class Question {
    static create(question){
        return fetch('https://jstest1-50541-default-rtdb.europe-west1.firebasedatabase.app/questions.json', {
            method : 'POST',
            body : JSON.stringify(question),
            headers : {
                'Content-type' : 'application/json'
            }
        })
        .then(response => response.json())
        .then(response => {
            question.id = response.name
            return question
        })
        .then(addToLocalStorage)
        .then(Question.renderList)
    }
    static fetch(token){
        if(!token){
            return Promise.resolve(`<p class="error">У вас нет токена</p>`)
        }
        return fetch(`https://jstest1-50541-default-rtdb.europe-west1.firebasedatabase.app/questions.json?auth=${token}`)
        .then(response => response.json())
        .then(response => {
            if(response && response.error){
                return `<p class="error">${response.error}</p>`
            }
            return response ? Object.keys(response).map(key => ({
                ...response[key],
                id: key
            })) : []
        })
    }
    static renderList(){
        const questions = getQuestionFromLocalStorage()
        const html = questions.length ? questions.map(toCard).join('') : `<div class="mui--text-headline"> Вы пока ничего не спрашивали </div>`
        const list = document.getElementById('list')
        list.innerHTML = html
    }

    static listTohtml(questions){
        return questions.length ? `<ol>${questions.map(q => `<li>${q.text}</li>`).join('')}</ol>` : `<p>Вопросов пока нет</p>`
    }
}
window.addEventListener('load',Question.renderList)

function addToLocalStorage(question){
    const all = getQuestionFromLocalStorage()
    all.push(question)
    localStorage.setItem('questions', JSON.stringify(all))
}

function getQuestionFromLocalStorage(){
    return JSON.parse(localStorage.getItem('questions') || '[]')
}

function toCard(question){
    return `
    <div class="mui--text-black-54">
        ${new Date(question.date).toLocaleDateString()}
        ${new Date(question.date).toLocaleTimeString()}
    </div>
    <div>${question.text}</div>
    `
}

function isValid(value){
    return value.length >= 10
}

const form = document.getElementById('form')
form.addEventListener('submit', submitFormHandler)


const input = form.querySelector('#question-input')
input.addEventListener('input', () => {
    submitBtn.disabled = !isValid(input.value)
})


const modalBtn = document.getElementById('modal-btn')
modalBtn.addEventListener('click', openModal)


const submitBtn = form.querySelector('#submit')




function submitFormHandler(e){
    e.preventDefault()

    console.log(input.value)

    if(isValid(input.value)){
        const question = {
            text: input.value.trim(),
            date: new Date().toJSON()
        }
        
        submitBtn.disabled = true
        Question.create(question).then(() => {
            input.value = ''
            input.className = ''
            submitBtn.disabled = false
        })

    }
}

function authFormHandler(e){
    e.preventDefault()

    const email = e.target.querySelector('#email').value
    const pass = e.target.querySelector('#password').value
    const btn = e.target.querySelector('button')

    btn.disabled = true
    authWithPasswordAndEmail(pass,email)
    .then(Question.fetch)
    .then(renderModalAfterAuth)
    .then (() => btn.disabled = false)
}

function renderModalAfterAuth(content){
    if (typeof content === 'string'){
        createModal('Ошибка!', content)
    } else {
        createModal('Список вопросов', Question.listTohtml(content))
    }
}

function getAuthForm(){ 
    const html = `
        <form class="mui-form" id="auth-form">
            <div class="mui-textfield mui-textfield--float-label">
                <input type="email" id="email" required>
                <label>Ваша почта</label>
            </div>
            <div class="mui-textfield mui-textfield--float-label">
                <input type="password" id="password" required>
                <label>Пароль</label>
            </div>
            <button type="submit" id="submit" class="mui-btn mui-btn--raised mui-btn--primary">Войти</button>
        </form>
    `
    return html
}

function authWithPasswordAndEmail(pass,email){
    const apiKey = 'AIzaSyDR3COs4SzlisTz30tmptwaouuIU5ZoqlQ'
    return fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`, {
        method: 'POST',
        body : JSON.stringify({
            email,pass ,
            returnSecureToken: true
        }),
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => data.idToken)
}