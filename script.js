function createState(obj){

  let store = obj

  let listeners = []

  return{

    getState(){
      return store
    },

    setState(newObj){
      store = {
        ...store,
        ...newObj
      }

      listeners.forEach(fun => fun())
    },
    
    subscribe(fun){

      listeners.push(fun)
    }
  }

}

let store = createState({
  posts: [],
  loading: false,
  error: null,

  actionLoading: false,
  actionError: null,

  search: '',
  editingId: null,

  toast: null//toast тоже написал
})


let form = document.querySelector('.post-form')
let titleInput = document.querySelector('.title-input')
let bodyInput = document.querySelector('.body-input')


let searchInput = document.querySelector('.search-input')

let statusOfPosts = document.querySelector('.status')

let actionStatus = document.querySelector('.action-status')
let counterTodos = document.querySelector('.counter')
let toast = document.querySelector('.toast')

let listOfPosts = document.querySelector('.posts-list')

function render(){

  let data = store.getState()


  titleInput.disabled = data.actionLoading
  bodyInput.disabled = data.actionLoading
  form.querySelector('button').disabled = data.actionLoading


  listOfPosts.innerHTML = ''

  if(data.loading){
    statusOfPosts.textContent = 'Loading'
    return
  }

  if(data.error){
    statusOfPosts.textContent = data.error
    return
  }

  if(data.actionLoading){
    actionStatus.textContent = 'Action loading'
  }
  else if(data.actionError){
    actionStatus.textContent = data.actionError
  }
  else{
    actionStatus.textContent = ''
  }

  if(data.toast){
    toast.textContent = data.toast.message
    toast.className = `toast ${data.toast.type}`
  }
  else{
    toast.textContent = ''
    toast.className = 'toast'
  }

 

  let visiblePosts = getVisiblePosts()

  counterTodos.textContent = visiblePosts.length

  if(visiblePosts.length === 0){
    statusOfPosts.textContent = 'No posts found'
    return
  }

  
  
  statusOfPosts.textContent = ''

  for(let {id, title, body} of visiblePosts){

    let li = document.createElement('li')
    li.classList.add('post')
    li.dataset.id = id

    if(data.editingId === id){

      let titleIn = document.createElement('input')
      titleIn.classList.add('edit-title-input')
      titleIn.value = title

      let bodyIn = document.createElement('input')
      bodyIn.classList.add('edit-body-input')
      bodyIn.value = body

      let saveBtn = document.createElement('button')
      saveBtn.classList.add('save-btn')
      saveBtn.textContent = 'SAVE'
      saveBtn.disabled = data.actionLoading


      let cancelBtn = document.createElement('button')
      cancelBtn.classList.add('cancel-btn')
      cancelBtn.textContent = 'CANCEL'
      cancelBtn.disabled = data.actionLoading

      li.append(titleIn, bodyIn, saveBtn, cancelBtn)
    }
    else{
    let header = document.createElement('h3')
    header.classList.add('title')
    header.textContent = title

    let span = document.createElement('span')
    span.classList.add('body')
    span.textContent = body

    let delBtn = document.createElement('button')
    delBtn.classList.add('delete-btn')
    delBtn.textContent = 'DELETE'
    delBtn.disabled = data.actionLoading

    let editBtn = document.createElement('button')
    editBtn.classList.add('edit-btn')
    editBtn.textContent = 'EDIT'
    editBtn.disabled = data.actionLoading

    li.append(header, span, delBtn, editBtn)
    
    }

    listOfPosts.append(li)
  }
}

store.subscribe(render)

async function loadPosts(){

  store.setState({loading: true, error: null})

  try{

    let response = await fetch(`https://jsonplaceholder.typicode.com/posts`)

    if(!response.ok) throw new Error(`данныее не получены`)

      let result = await response.json()

      store.setState({
        posts: result,
        loading: false
      })
  }
  catch(err){
    store.setState({
      error: err.message,
      loading: false
    })
  }
}

loadPosts()

form.addEventListener('submit', (event) => {

 

  event.preventDefault()

  let data = store.getState()
  if(data.actionLoading) return


  
  
  let titleValue = titleInput.value.trim()
  let bodyValue = bodyInput.value.trim()

  if(!titleValue || !bodyValue) return

  addPost(titleValue, bodyValue)

  titleInput.value = ''
  bodyInput.value = ''
})

async function addPost(title, body){

  store.setState({actionLoading: true, actionError: null})

  try{

    let response = await fetch(`https://jsonplaceholder.typicode.com/posts`, {
      method: 'POST',
      headers:{
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: title,
        body: body
      })
    })

    if(!response.ok) throw new Error('данные не отправлены')

      let result = await response.json()
      let dataPosts = store.getState().posts

      store.setState({
      posts: [result, ...dataPosts],
      actionLoading: false,
    })

    showToast('Post added successfully', 'success')
  }
  catch(err){
    store.setState({
      actionError: err.message, 
      actionLoading: false})
  }
}


function debounce(fn, delay){

  let timerId

  return function(){
    
    clearTimeout(timerId)

    timerId = setTimeout(() => {
      fn()
    }, delay)
  }
}

let debouncedSearch = debounce(() => {
  store.setState({search: searchInput.value})
}, 300)

searchInput.addEventListener('input', debouncedSearch)

function getVisiblePosts(){

  let state = store.getState()

  let posts = state.posts
  let search = state.search.toLowerCase().trim()

  if(!search) return posts

  let filteredPosts = posts.filter(el => { 
    return el.title.toLowerCase().includes(search) || el.body.toLowerCase().includes(search)})

  return filteredPosts

  
}

listOfPosts.addEventListener('click', (event) => {

  let data = store.getState()

  if(event.target.matches('.delete-btn')){

    if(data.actionLoading) return

    let post = event.target.closest('.post')
    let id = Number(post.dataset.id)

    deletePost(id)
  }

  if(event.target.matches('.edit-btn')){

     if(data.actionLoading) return

    let post = event.target.closest('.post')
    let id = Number(post.dataset.id)

    store.setState({editingId: id})
  }

  if(event.target.matches('.cancel-btn')){

     if(data.actionLoading) return

    store.setState({editingId: null})
  }

  if(event.target.matches('.save-btn')){

     if(data.actionLoading) return

    let post = event.target.closest('.post')

    let inputTitleValue = post.querySelector('.edit-title-input').value.trim()
    let inputBodyValue = post.querySelector('.edit-body-input').value.trim()

    if(!inputTitleValue || !inputBodyValue) return

    let id = Number(post.dataset.id)

    upgradePost(id, inputTitleValue, inputBodyValue)
    

  }
})

async function deletePost(id) {
  
  let previousPosts = store.getState().posts

  let filteredPosts = previousPosts.filter(el => el.id !== id)

  store.setState({
    posts: filteredPosts,
    actionLoading: true,
    actionError: null,
  })

  try{

    let response = await fetch(`https://jsonplaceholder.typicode.com/posts/${id}`, {
      method: 'DELETE'
    })

    if(!response.ok) throw new Error('данные не удалены')

      store.setState({
        actionLoading: false,
      })

      showToast('Post deleted', 'success')
  }
  catch(err){
    store.setState({
      posts: previousPosts,
      actionLoading: false,
      actionError: err.message
    })
    showToast('Post is not deleted', 'error')
  }
}

async function upgradePost(id, titleValue, bodyValue) {
  
  store.setState({actionLoading: true, actionError: null})

  try{

    let response = await fetch(`https://jsonplaceholder.typicode.com/posts/${id}`, {

      method: 'PATCH',
      headers:{
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: titleValue,
        body: bodyValue
      })
    })

    if(!response.ok) throw new Error('данные не обновлены')

      let result = await response.json()

      let dataOfPosts = store.getState().posts

      let mapPosts = dataOfPosts.map(el => {

        if(el.id === id){
          return {
            ...el,
            ...result,
           title: titleValue,
           body: bodyValue
          }
        }

        return el
      })

      store.setState({
        posts: mapPosts,
        actionLoading: false,
        editingId: null

      })
      showToast('post upgraded successfully', 'success')
  }
  catch(err){
    store.setState({actionLoading: false, actionError: err.message})
    showToast('Update failed', 'error')
  }
}

function createShowToast(){

  let totalTimerId

  return function(message, type){

    clearTimeout(totalTimerId)

    store.setState({
      toast:{
        message,
        type
      }
    })

    totalTimerId = setTimeout(() => {
      store.setState({
        toast: null
      })
    }, 2000)
  }
}

let showToast = createShowToast()//отлично, что делаем дальше