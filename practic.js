function createStore(obj){

    let store = obj
    let listener = []

    return {

        getState(){
            return store
        },

        setState(newObj){
            store = {
                ...store,
                ...newObj
            }


            listener.forEach(fun => fun())
        },

        subscribe(fun){
            listener.push(fun)
        }
    } 
}

let searchInput = document.querySelector('.search-input')

let categorySelect = document.querySelector('.category-select')
let sortSelect = document.querySelector('.sort-select')

let status = document.querySelector('.status')
let counter = document.querySelector('.counter')

let productList = document.querySelector('.products-list')

let cartCounter = document.querySelector('.cart-counter')
let cartTotal = document.querySelector('.cart-total')
let cartList = document.querySelector('.cart-list')

let store = createStore({

  products: [],
  productsLoading: false,
  productsError: null,

  cart: [],

  search: '',
  category: 'all',
  sort: 'default'
})

async function loadProducts() {
    
    store.setState({
        productsLoading: true,
        productsError: null
    })

    try{

        let response = await fetch(`https://fakestoreapi.com/products`)

        if(!response.ok) throw new Error(`данные не получены`)

            let result = await response.json()

            store.setState({
                products: result,
                productsLoading: false,
                productsError: null
            })
    }
    catch(err){
        store.setState({
            productsLoading: false,
            productsError: err.message
        })
    }
}

function renderProduct(){

    productList.innerHTML = ''

    let data = store.getState()

    if(data.productsLoading){
        status.textContent = 'Loading'
        return
    }

    if(data.productsError){
        status.textContent = data.productsError
        return
    }

    let visibleProducts = getVisibleProduct()

    if(visibleProducts.length === 0){
        status.textContent = 'No products found'
        counter.textContent = 0
        return
    }

    status.textContent = ''
    counter.textContent = visibleProducts.length

    for(let {id, title, price, category, image} of visibleProducts){

        let li = document.createElement('li')
        li.classList.add('product')
        li.dataset.id = id

        let img = document.createElement('img')
        img.classList.add('image')
        img.src = image
        img.alt = title
        img.width = 100

        let header = document.createElement('h3')
        header.classList.add('title')
        header.textContent = title


        let descCategory = document.createElement('p')
        descCategory.classList.add('category')
        descCategory.textContent = category

        let priceStrong = document.createElement('strong')
        priceStrong.classList.add('price')
        priceStrong.textContent = `$${price}`

        let addBtn = document.createElement('button')
        addBtn.classList.add('add-button')
        addBtn.textContent = 'ADD TO CART'

        li.append(img, header, descCategory, priceStrong, addBtn)

        productList.append(li)
    }
}

function createDebaunce(fun, delay){

    let timerId

    return function(){

        clearTimeout(timerId)

        timerId = setTimeout(() => fun(), delay)
    }
}



let debounce = createDebaunce(() => store.setState({search: searchInput.value}), 500)

searchInput.addEventListener('input', () => {

    debounce()
})

sortSelect.addEventListener('change', () => {

    store.setState({
        sort: sortSelect.value
    })
})

function getVisibleProduct(){

    let data = store.getState()

    let search = data.search.toLowerCase().trim()

    let filtered = data.products.filter(el => {
        return el.title.toLowerCase().includes(search) || el.category.toLowerCase().includes(search)
    })

    if(data.sort === 'price-asc'){

        filtered.sort((a,b) => a.price - b.price)
    }

    if(data.sort === 'price-desc'){

        filtered.sort((a,b) => b.price - a.price)
    }

    if(data.category !== 'all'){

        filtered = filtered.filter(el => el.category === data.category)
    }

    return filtered
}

categorySelect.addEventListener('change', () => {

    store.setState({
        category: categorySelect.value
    })
})

function renderCategories(){

    categorySelect.innerHTML = `<option value="all">All categories</option>`

    let data = store.getState()
    let categories = []

    for(let {category} of data.products){

        if(!categories.includes(category)){
            categories.push(category)
        }
    }

    for(let el of categories){

        let option = document.createElement('option')
        option.value = el
        option.textContent = el

        categorySelect.append(option)
    }

    categorySelect.value = data.category
}


productList.addEventListener('click', (event) => {

    if(event.target.matches('.add-button')){

        let product = event.target.closest('.product')

        let id = Number(product.dataset.id)
        addToCart(id)

    }
})

function addToCart(id){

    let data = store.getState()

    let product = data.products.find(el => el.id === id)

    if(!product) return

    let existingItem = data.cart.find(el => el.id === id)

    let newCart

    if(existingItem){

        newCart = data.cart.map(item => {

            if(item.id === id){
                return{
                    ...item,
                    quantity: item.quantity + 1
                }
            }
            return item
        })
    }
    else{
        newCart = [
            ...data.cart,
            {
                ...product,
                quantity: 1
            }
        ]
    }

    store.setState({
        cart:  newCart
    })
}

function renderCart(){

    cartList.innerHTML = ''
    
    let data = store.getState()

    if(data.cart.length === 0){
        cartCounter.textContent = 0
        cartTotal.textContent = `$0`
        return
    }

    cartCounter.textContent = data.cart.reduce((count, el) => count + el.quantity, 0)

    cartTotal.textContent = data.cart.reduce((sum, el) => sum + el.price * el.quantity, 0)

    for(let {id, title, price, quantity} of data.cart){

        let li = document.createElement('li')
        li.classList.add('cart-item')
        li.dataset.id = id

        let titleSpan = document.createElement('span')
        titleSpan.textContent = title

        let quantitySpan = document.createElement('span')
        quantitySpan.textContent = `x${quantity}`

        let priceSpan = document.createElement('strong')
        priceSpan.textContent = `$${(price * quantity).toFixed(2)}`

        let minusBtn = document.createElement('button')
        minusBtn.classList.add('minus-button')
        minusBtn.textContent = '-'

        let plusBtn = document.createElement('button')
        plusBtn.classList.add('plus-button')
        plusBtn.textContent = '+'

        let removeBtn = document.createElement('button')
        removeBtn.classList.add('remove-button')
        removeBtn.textContent = 'REMOVE'

        li.append(titleSpan, quantitySpan, priceSpan, minusBtn, plusBtn, removeBtn)
        cartList.append(li)
    }
}

cartList.addEventListener('click', (event)=>{

    let cart = event.target.closest('.cart-item')

    if(!cart) return

    let id = Number(cart.dataset.id)

    if(event.target.matches('.plus-button')){
        increaseCartItem(id)
    }

    if(event.target.matches('.minus-button')){
        decreaseCartItem(id)
    }
    if(event.target.matches('.remove-button')){
        removeCartItem(id)
    }
})

function increaseCartItem(id){

    let data = store.getState()
    
    let newCart = data.cart.map(el => {

        if(el.id === id){
            return {
                ...el,
                quantity: el.quantity + 1
            }
        }
        return el
    })

    store.setState({
        cart: newCart
    })
}

function decreaseCartItem(id){

    let data = store.getState()

    let newCart = data.cart.map(el => {

        if(el.id === id){
            return{
                ...el,
                quantity: el.quantity - 1
            }
        }
        return el
    }).filter(item => item.quantity > 0)

    store.setState({
        cart:newCart
    })
}


function removeCartItem(id){

  let data = store.getState()

  let newCart = data.cart.filter(item => item.id !== id)

  store.setState({
    cart: newCart
  })
}



store.subscribe(renderCart)
store.subscribe(renderProduct)
store.subscribe(renderCategories)
loadProducts()

