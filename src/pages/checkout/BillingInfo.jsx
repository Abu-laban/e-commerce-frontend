import React, { useContext, useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import styled from "styled-components";
import superagent from "superagent";
import { AuthContext } from "../../context/authentication";

const BillingContainer = styled.div`
  width: 60%;
  display: inline-block;
  border: 0.5px solid teal;
  margin: 30px 40px 40px 90px;
`;

const Title = styled.h1`
  font-size: 24px;
  font-weight: 300;
  margin: 10px;
  border: 0.5px solid teal;
  text-align: center;
`;

const Form = styled.form`
  display: flex;
  flex-wrap: wrap;
`;

const InputDiv = styled.div`
  width: 90%;
  margin: 10px;
`;

const Lable = styled.label`
  flex: 1;
  width: 400px;
  padding: 10px;
`;

const Input = styled.input`
  flex: 1;
  width: 400px;
  padding: 10px;
  border: 0.5px solid teal;
`;

const DescriptionP = styled.p`
  color: gray;
  margin: 5px 125px;
`;

const Button = styled.button`
  width: 40%;
  border: none;
  padding: 15px 20px;
  background-color: teal;
  color: white;
  cursor: pointer;
  margin: 7px;
`;

// ------------------------
const Summary = styled.div`
  display: inline-block;
  margin: 50px 15px 15px 15px;
  flex: 1;
  float: right;
  border: 0.5px solid teal;
  width: 300px;
  border-radius: 10px;
  padding: 20px;
`;

const SummaryTitle = styled.h1`
  font-weight: 200;
`;

const SummaryItem = styled.div`
  margin: 30px 0px;
  display: flex;
  justify-content: space-between;
  font-weight: ${(props) => props.type === "total" && "500"};
  font-size: ${(props) => props.type === "total" && "24px"};
`;

const SummaryItemText = styled.span``;
const SummaryItemPrice = styled.span``;

function BillingInfo() {
  const [cartInfo, setCartInfo] = useState({
    totalPrice: 0,
    totalItems: 0,
  });
  const context = useContext(AuthContext);
  const [addressId, setAddressId] = useState(0);
  const [cartResponse, setCartResponse] = useState({});

  useEffect(() => {
    if (context.loggedIn) {
      superagent
        .get(
          "https://mid-project-01.herokuapp.com/api/v3/cartProductsInfo/" +
            context.user.id
        )
        .then((results) => {
          setCartInfo(results.body);
        });
    }
  }, []);

  async function handelSubmit(event) {
    event.preventDefault();
    if (context.loggedIn) {
      superagent
        .get( // get the user address from the db
          `https://mid-project-01.herokuapp.com/api/v3/address/${context.user.id}`
        )
        .then((response) => {
          if (Object.keys(response.body).length !== 0) {
            setAddressId(response.body[0].id);
          }
        })
        .catch((e) => {
          console.log(e);
        });
      superagent
        .get( // get total price and total number of items from the cart
          `https://mid-project-01.herokuapp.com/api/v3/cartProductsInfo/${context.user.id}`
        )
        .then((response) => {
          setCartResponse(response.body);
        });
      await superagent // add new order
        .post("https://mid-project-01.herokuapp.com/api/v2/Order")
        .send({
          UserID: context.user.id,
          AdressID: addressId,
          TotalPrice: cartResponse.totalPrice,
          Quantity: cartResponse.totalItems,
          State: "",
        })
        .set("Authorization", "Bearer " + context.token)
        .then(async (res) => {
          await superagent
            .get( // get the user products from the cart
              `https://mid-project-01.herokuapp.com/api/v3/cartProducts/${context.user.id}`
            )
            .then((response) => {
              Promise.all(
                response.body.map(async (element) => {
                  await superagent
                    .post( // Add new order detail
                      "https://mid-project-01.herokuapp.com/api/v2/OrderDetails"
                    )
                    .send({
                      ProductID: element.ProductID.id,
                      UserID: context.user.id,
                      ColorID: element.ColorID.id,
                      SizeID: element.SizeID.id,
                      OrderID: res.body.id,
                      Quantity: element.Quantity,
                    })
                    .set("Authorization", "Bearer " + context.token);
                })
              );
            });

          superagent
            .delete(
              // delete all cart Items
              `https://mid-project-01.herokuapp.com/api/v3/cart/${context.user.id}`
            )
            .set("Authorization", "Bearer " + context.token)
            .then((resulte) => {
              console.log(resulte.body);
            });
        });
    }
  }

  return (
    <>
      <Navbar />
      <BillingContainer>
        <Title>Billing Information</Title>
        <InputDiv style={{ textAlign: "center" }}>
          <img
            style={{ marginRight: "10px" }}
            src="https://www.uxfordev.com/demo/1.0.6/assets/images/payment-icon-set/icons/visa-curved-32px.png"
            alt="Visa"
          />
          <img
            style={{ marginRight: "10px" }}
            src="https://www.uxfordev.com/demo/1.0.6/assets/images/payment-icon-set/icons/mastercard-curved-32px.png"
            alt="MasterCard"
          />
          <img
            style={{ marginRight: "10px" }}
            src="https://www.uxfordev.com/demo/1.0.6/assets/images/payment-icon-set/icons/american-express-curved-32px.png"
            alt="American Ex"
          />
          <img
            style={{ marginRight: "10px" }}
            src="https://www.uxfordev.com/demo/1.0.6/assets/images/payment-icon-set/icons/maestro-curved-32px.png"
            alt="Maestro"
          />
        </InputDiv>
        <Form onSubmit={handelSubmit}>
          <InputDiv>
            <Lable>Name on Card*</Lable>
            <Input
              placeholder="Your Name"
              type="text"
              name="cardName"
              required
            />
            <DescriptionP>As it appears on the card</DescriptionP>
          </InputDiv>
          <InputDiv>
            <Lable>Card Number*</Lable>
            <Input
              placeholder="••••  ••••  ••••  ••••"
              type="text"
              name="cardNumber"
              required
            />
            <DescriptionP>
              The 16 digits on the front of your credit card.
            </DescriptionP>
          </InputDiv>
          <InputDiv>
            <Lable>Expiration Date*</Lable>
            <select required>
              <option>01</option>
              <option>02</option>
              <option>03</option>
              <option>04</option>
              <option>05</option>
              <option>06</option>
              <option>07</option>
              <option>08</option>
              <option>09</option>
              <option>10</option>
              <option>11</option>
              <option>12</option>
            </select>
            <span>/</span>
            <select required>
              <option>2021</option>
              <option>2022</option>
              <option>2023</option>
              <option>2024</option>
              <option>2025</option>
              <option>2026</option>
              <option>2027</option>
            </select>
            <DescriptionP>
              The date your credit card expires. Find this on the front of your
              credit card.
            </DescriptionP>
          </InputDiv>
          <InputDiv>
            <Lable>Security Code*</Lable>
            <Input placeholder="CVC" type="text" name="cvc" required />
            <DescriptionP>
              The last 3 digits displayed on the back of your credit card.
            </DescriptionP>
          </InputDiv>
          <InputDiv>
            <Button type="submit">Make Payment</Button>
          </InputDiv>
        </Form>
      </BillingContainer>

      <Summary>
        <SummaryTitle>ORDER SUMMARY</SummaryTitle>
        <SummaryItem>
          <SummaryItemText>Subtotal</SummaryItemText>
          <SummaryItemPrice>$ {cartInfo.totalPrice}</SummaryItemPrice>
        </SummaryItem>
        <SummaryItem>
          <SummaryItemText>Estimated Shipping</SummaryItemText>
          <SummaryItemPrice>$ 15.90</SummaryItemPrice>
        </SummaryItem>
        <SummaryItem>
          <SummaryItemText>Shipping Discount</SummaryItemText>
          <SummaryItemPrice>$ -5.90</SummaryItemPrice>
        </SummaryItem>
        <SummaryItem type="total">
          <SummaryItemText>Total</SummaryItemText>
          <SummaryItemPrice>$ {cartInfo.totalPrice + 10}</SummaryItemPrice>
        </SummaryItem>
      </Summary>
    </>
  );
}

export default BillingInfo;
