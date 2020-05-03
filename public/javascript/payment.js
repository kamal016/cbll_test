if (document.readyState == 'loading') {
    document.addEventListener('DOMContentLoaded', ready)
} else {
    ready()
}

function ready() {
    // var removeCartItemButtons = document.getElementsByClassName('btn-danger')
    // for (var i = 0; i < removeCartItemButtons.length; i++) {
    //     var button = removeCartItemButtons[i]
    //     button.addEventListener('click', removeCartItem)
    // }

    // var quantityInputs = document.getElementsByClassName('cart-quantity-input')
    // for (var i = 0; i < quantityInputs.length; i++) {
    //     var input = quantityInputs[i]
    //     input.addEventListener('change', quantityChanged)
    // }

    // var addToCartButtons = document.getElementsByClassName('shop-item-button')
    // for (var i = 0; i < addToCartButtons.length; i++) {
    //     var button = addToCartButtons[i]
    //     button.addEventListener('click', addToCartClicked)
    // }

    document.getElementsByClassName('btn-purchase')[0].addEventListener('click', purchaseClicked)
}


var stripeHandler = StripeCheckout.configure({
    key: 'pk_test_HHFzq58fTcicGlNuiDi6Ql4D00fEwCbWNS',
    locale: 'en',
    token: function(token) {
        console.log("HEre is the token bro : " , token);
    }
})


function purchaseClicked() {
    console.log("Purchased Button clicked :")
    // var priceElement = document.getElementsByClassName('cart-total-price')[0]
    // var price = parseFloat(priceElement.innerText.replace('$', '')) * 100
    stripeHandler.open({
        amount: 10
    })
}
