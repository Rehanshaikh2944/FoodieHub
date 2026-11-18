import { useContext } from "react";
import "./Cart.css";
import { StoreContext, getFoodImageUrl } from "../../context/StoreContext";
import { useEffect } from 'react'
import { useNavigate } from "react-router-dom";

const Cart = () => {
  const navigate = useNavigate ();
    useEffect(() => {
        window.scrollTo(0, 0)
    }, [])
  

  const {
    cartItems,
    food_list,
    removeFromCart
  } = useContext(StoreContext);

  const cartHasItems = food_list.some(
    (item) => cartItems[item._id] > 0
  );

  const getCartTotal = () => {
    let total = 0;

    food_list.forEach((item) => {
      if (cartItems[item._id] > 0) {
        total += item.price * cartItems[item._id];
      }
    });

    return total;
  };

  const subtotal = getCartTotal();
  const deliveryFee = subtotal > 0 ? 40 : 0;
  const total = subtotal + deliveryFee;

  

  return (
    <div className="cart">

      <div className="cart-container">

        {/* Page Heading */}

        <div className="cart-heading">

          <p className="cart-eyebrow">
            YOUR CART
          </p>

          <h1>
            Ready to <span>order?</span>
          </h1>

        </div>


        {/* Cart Layout */}

        <div className="cart-layout">


          {/* Left Side - Cart */}

          <div className="cart-items">

            {cartHasItems ? (

              <>

                {/* Cart Header */}

                <div className="cart-items-title">

                  <p>Item</p>
                  <p>Title</p>
                  <p>Price</p>
                  <p>Quantity</p>
                  <p>Total</p>
                  <p>Remove</p>

                </div>

                <br />

                <hr />


                {/* Cart Items */}

                {food_list.map((item) => {

                  if (cartItems[item._id] > 0) {

                    return (
                      <div key={item._id}>

                        <div className="cart-items-title cart-items-item">

                          <img
                            src={getFoodImageUrl(item.image)}
                            alt={item.name}
                          />

                          <p>
                            {item.name}
                          </p>

                          <p>
                            ₹{item.price}
                          </p>

                          <p>
                            {cartItems[item._id]}
                          </p>

                          <p>
                            ₹{item.price * cartItems[item._id]}
                          </p>

                          <p
                            onClick={() => removeFromCart(item._id)}
                            className="cross"
                          >
                            ×
                          </p>

                        </div>

                        <hr />

                      </div>
                    );
                  }

                  return null;

                })}

              </>

            ) : (

              /* Empty Cart */

              <div className="empty-cart">

                <h3>
                  Your cart is empty 🛒
                </h3>

                <p>
                  Browse the menu and add something delicious.
                </p>

                <button onClick={()=> {navigate("/#explore-menu");}} >
                  Explore menu →
                </button>

              </div>
            )}

          </div>

          {/* Right Side - Order Summary */}
          <div className="cart-summary">
            <h2>
              Order summary
            </h2>
            <div className="summary-row">
              <p>
                Subtotal
              </p>
              <p>
                ₹{subtotal}
              </p>

            </div>

            <div className="summary-row">

              <p>                Delivery
              </p>
              <p>
                ₹{deliveryFee}
              </p>

            </div>
            <hr />
            <div className="summary-total">
              <p>
                Total
              </p>
              <p>
               ₹{total}
              </p>
            </div>
            <button className="checkout-button" onClick={()=>navigate('/order')}>Proceed to checkout→</button>
            <p className="checkout-note">             
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;