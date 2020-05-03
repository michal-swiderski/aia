const express = require('express');
const bodyParser = require('body-parser');
const cookieSession = require('cookie-session');
const path = require('path');
const app = express();
const {getProducts, getProductsByUuids} = require('./product.js');
const {checkout, CheckoutError} = require('./cart.js');

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(bodyParser.urlencoded());
app.use(cookieSession({
    name: 'session',
    keys: ['COVID-19']
}))

app.use((req, res, next) => {
    if (!Array.isArray(req.session.cart)) {
        req.session.cart = [];
    }
    next();
})

app.get('/', async (req, res) => {
    let error;
    switch (req.query.error) {
        case undefined :
            error = null;
            break;
        case 'itembought' :
            error = 'Item has already been bought.';
            break;
        default:
            error = 'Something went wrong';
    }
    const products = await getProducts();
    res.render('index', {error: error, products, cart: req.session.cart})
});

app.post('/add_to_cart', (req, res) => {
    req.session.cart.push(req.body.uuid);
    res.redirect('/');
});

app.post('/remove_from_cart', (req, res) => {
    req.session.cart = req.session.cart.filter(uuid => uuid !== req.body.uuid);
    res.redirect('/cart');
});

app.post('/clear_cart', (req, res) => {
    req.session.cart = [];
    res.redirect('/');
});

app.get('/cart', async (req, res) => {
    const cart = await getProductsByUuids(req.session.cart);
    res.render('checkout', {cart});
});

app.post('/checkout', async (req, res) => {
    try {
        await checkout(req.session.cart);
        req.session.cart = [];
        res.redirect('/');
    } catch (e) {
        req.session.cart = [];
        if (e instanceof CheckoutError) {
            res.redirect('/?error=itembought')
        } else {
            res.redirect('/?error=checkouterror')
        }
    }
});

app.listen(8080, () => console.log('Running at 8080'));