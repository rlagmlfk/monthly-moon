import React from "react";
import axios from "axios";
import { P_SMALL, P_STRONG } from "../../../styles/SubStyle";
import Footer from "../Common/Footer";
import Header from "../Common/Header";
import DaumPostcodeEmbed from "react-daum-postcode";
import { Col, Row, Modal } from "react-bootstrap";
import {
  modifyProfile,
  memberProfile,
  paymentlist,
  paytotal,
} from "./../../../service/dbLogic";
import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { BROWN_BTN } from "../../../styles/NoticeStyle";
import {
  FORM,
  ORDER_CHECKS,
  ORDER_LI,
  ORDER_NUM1,
  ORDER_P1,
  ORDER_SPAN,
  ORDER_UL,
  POINTSUM,
} from "../../../styles/PaymentStyle";
import {
  ORDER_WRAPPER,
  ORDER_CHECK,
  ORDER_BTN,
  ORDER_NUM2,
  ORDER_P2,
} from "./../../../styles/PaymentStyle";
import OrderPageRow from "./OrderPageRow";

const Payment = (effect, deps) => {
  useEffect(() => {
    const jquery = document.createElement("script");
    jquery.src = "https://code.jquery.com/jquery-1.12.4.min.js";
    const iamport = document.createElement("script");
    iamport.src = "https://cdn.iamport.kr/js/iamport.payment-1.1.7.js";
    document.head.appendChild(jquery);
    document.head.appendChild(iamport);
    return () => {
      document.head.removeChild(jquery);
      document.head.removeChild(iamport);
    };
  }, []);
  //return ();
};

const OrderPage = ({ no, props, myPoint }) => {
  useEffect(() => {
    const jquery = document.createElement("script");
    jquery.src = "https://code.jquery.com/jquery-1.12.4.min.js";
    const iamport = document.createElement("script");
    iamport.src = "https://cdn.iamport.kr/js/iamport.payment-1.1.7.js";
    document.head.appendChild(jquery);
    document.head.appendChild(iamport);
    return () => {
      document.head.removeChild(jquery);
      document.head.removeChild(iamport);
    };
  }, []);
  let navigate = useNavigate();

  const [show, setShow] = useState(false);

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  const [shipFee, setShipFee] = useState(0); /* 배송비 */

  const [orderInfo, setOrderInfo] = useState({
    cart_no: 0,
    cart_quantity: 0,
    order_type: "",
    md_name: "",
    order_amount: 0 /* 주문총금액 (상품금액*개수)  */,
    order_payment: 0 /* 총결제금액 (상품금액*개수 - 포인트사용) */,
    order_used_point: 0,
  });

  const [memInfo, setMemInfo] = useState({
    member_no: 0,
    member_name: "",
    member_zipcode: "",
    member_address: "",
    member_address_detail: "",
    member_method: "",
    member_level: "",
    member_phone: 0,
    member_birth: "",
    member_email: "",
    member_date: "",
  });

  //수정할 회원정보 불러오기
  useEffect(() => {
    console.log("useEffet 호출");
    memberProfile({ member_no: no }).then((res) => {
      if (!res.data) {
        setMemInfo(res.data);
      } else {
        setMemInfo(res.data);
      }
    });
  }, [no]);

  // 수정하기 onChange 함수
  const onChange = (e) => {
    if (e.currentTarget === null) return;
    e.preventDefault();
    setMemInfo({
      ...memInfo,
      [e.target.name]: e.target.value,
    });
  };

  // 포인트 사용하기 onChange
  const pointChange = (e) => {
    if (e.currentTarget === null) return;
    e.preventDefault();
    setOrderInfo({
      ...orderInfo,
      [e.target.name]: e.target.value,
    });
  };

  ///// 다음 우편번호 찾기 함수 //////
  const handleComplete = (data) => {
    let fullAddress = data.address;
    let extraAddress = "";

    if (data.addressType === "R") {
      if (data.bname !== "") {
        extraAddress += data.bname;
      }
      if (data.buildingName !== "") {
        extraAddress +=
          extraAddress !== "" ? `, ${data.buildingName}` : data.buildingName;
      }
      fullAddress += extraAddress !== "" ? ` (${extraAddress})` : "";
    }
    console.log(data);
    console.log(data.zonecode); // 우편번호
    console.log(fullAddress); // 주소
    setMemInfo({
      ...memInfo,
      member_zipcode: data.zonecode, // 새로 수정할 우편번호 담기
      member_address: fullAddress, // 수정할 주소 담기
      member_address_detail: "", // 우편번호 api에서 셀렉되면 상세주소 칸은 비워주기
    });

    setShow(false);
  };

  /* **************************************************** */

  const [payList, setPayList] = useState([]);

  /* payList 데이터 가져오기 */
  useEffect(() => {
    const paymentList = async () => {
      await paymentlist({ member_no: no }).then((res) => {
        if (res.data === null) {
          return 0;
        } else {
          console.log(res.data);
          setPayList(res.data);
        }
      });
    };
    paymentList();
  }, [no]);

  /* 총결제금액 데이터 가져오기 */
  useEffect(() => {
    const payTotal = async () => {
      await paytotal({ member_no: no }).then((res) => {
        if (res.data === null) {
          return 0;
        } else {
          console.log(res.data);
          setOrderInfo({ order_amount: res.data.ORDER_AMOUNT });

          /* 구매금액 3만원 이상이면 배송비 0원 */
          if (res.data.ORDER_AMOUNT < 30000) {
            setShipFee(3000);
          } else setShipFee(0);
        }
      });
    };
    payTotal();
  }, [no]);

  /* *********포인트 모두사용************************* */

  const pointUseAll = () => {
    setOrderInfo({
      order_used_point: parseInt(myPoint.POINT_SUM),
      order_amount: parseInt(orderInfo.order_amount),
      order_payment:
        parseInt(orderInfo.order_amount) -
        parseInt(orderInfo.order_used_point) +
        shipFee,
    });
  };

  /* **************************************************** */

  const onClickPayment = (e) => {
    e.preventDefault();
    const { IMP } = window;
    IMP.init("imp26765046"); // 가맹점 식별코드 // 결제 데이터 정의

    let data = {
      pg: "html5_inicis", // PG사 (필수항목)
      pay_method: "card", // 결제수단 (필수항목)
      merchant_uid: `O_${new Date().getTime()}`,
      name:
        payList.length > 1
          ? payList[0].MD_NAME + " 외 " + (payList.length - 1) + "건"
          : payList[0].MD_NAME, // 주문명 (필수항목)
      amount:
        parseInt(orderInfo.order_amount) -
        parseInt(orderInfo.order_used_point) +
        shipFee, // 금액 (필수항목)
      //amount: 100,
      buyer_name: memInfo.member_name, // 구매자 이름
      buyer_tel: memInfo.member_phone, // 구매자 전화번호 (필수항목)
      buyer_email: memInfo.member_email, // 구매자 이메일
      buyer_addr: memInfo.member_address,
      order_type: "O", // 개별구매
      //buyer_postalcode: "우편번호", // ....
    };
    console.log("requestPay => " + JSON.stringify(data));
    IMP.request_pay(data, callback);
    console.log(payList[0].MD_NAME); /* 주문리스트 중 1번째 배열 상품명.. */
    console.log(data.buyer_name);
    console.log(data.buyer_tel);
    console.log(data.buyer_addr);
  };

  const callback = (res) => {
    const { success } = res;
    if (success) {
      alert("결제 성공");
      console.log(res);
      console.log(res.merchant_uid);
      navigate("/orderdetail/" + res.merchant_uid);
      let list = {
        // json 형태로 spring에 값을 넘김
        ORDER_NO: res.merchant_uid,
        MEMBER_NO: no,
        //CART_NO: "1", /////////////////// 일단 상수로 넣음 -> insert 안해도 될거가틈..
        CART_NO: payList[0].CART_NO,
        ORDER_PAYMENT: res.paid_amount,
        ORDER_AMOUNT:
          parseInt(orderInfo.order_amount) -
          parseInt(orderInfo.order_used_point) +
          shipFee,
        ORDER_DATE: `${new Date().getTime().toLocaleString}`,
        ORDER_USED_POINT: parseInt(orderInfo.order_used_point),
        PURCHASE_NO: "p" + res.merchant_uid,
        PURCHASE_METHOD: res.pay_method + res.card_name + res.card_number,
        ORDER_DE_NO: "d" + res.merchant_uid,
        ORDER_DE_QUANTITY: payList.length,
        ORDER_DE_PRICE: res.paid_amount,
        ORDER_DE_CANCEL: "N",
        DELIVERY_STATUS: "상품준비중",
        DELIVERY_ADDRESS: res.buyer_addr,
        DELIVERY_PHONE: res.buyer_tel,
        DELIVERY_FEE: shipFee,
      };

      axios
        .post(process.env.REACT_APP_SPRING_IP + "paymentInsert", list)
        .then((response) => {
          console.log(response);
          console.log(response.data);
          pointUpdate();
        })
        .catch((error) => {
          console.log(error);
        });
      const pointUpdate = () => {
        axios
          .post(process.env.REACT_APP_SPRING_IP + "payPointUpdate", list)
          .then((response) => {
            console.log(response);
            console.log(response.data);
          })
          .catch((error) => {
            console.log(error);
          });
      };
    }
  };

  /* ***************************************************** */

  return (
    <>
      <Header />
      <div className="container" style={{ padding: "80px 0 200px 0" }}>
        <P_STRONG>주문하기 (개별구매)</P_STRONG>

        <Row className="mb-5">
          <Col xs={12} md={7}>
            {/* ************회원정보시작 ************ */}
            <FORM id="f_modifym">
              <P_SMALL>배송정보</P_SMALL>
              <div className="mb-3 mt-3 row">
                <label className="col-sm-2 col-form-label">이름</label>
                <div className="col-sm-5">
                  <input
                    type="text"
                    name="member_name"
                    id="member_name"
                    value={(memInfo && memInfo.member_name) || ""}
                    onChange={onChange}
                    className="form-control"
                  />
                </div>
              </div>

              <div className="mb-3 row">
                <label className="col-sm-2 col-form-label">배송지</label>
                <div className="col-sm-5 d-flex">
                  <input
                    type="text"
                    name="member_zipcode"
                    id="member_zipcode"
                    value={(memInfo && memInfo.member_zipcode) || ""}
                    onChange={onChange}
                    className="form-control"
                  />
                  <BROWN_BTN onClick={handleShow} type="button">
                    우편번호
                  </BROWN_BTN>
                </div>
              </div>

              <div className="mb-3 row">
                <label className="col-sm-2 col-form-label"></label>
                <div className="col-sm-7 d-flex">
                  <input
                    type="text"
                    name="member_address"
                    id="member_address"
                    value={(memInfo && memInfo.member_address) || ""}
                    onChange={onChange}
                    className="form-control"
                  />
                </div>
              </div>

              <div className="mb-3 row">
                <label className="col-sm-2 col-form-label"></label>
                <div className="col-sm-7 d-flex">
                  <input
                    type="text"
                    name="member_address_detail"
                    id="member_address_detail"
                    value={(memInfo && memInfo.member_address_detail) || ""}
                    onChange={onChange}
                    className="form-control"
                  />
                </div>
              </div>

              <div className="mb-4 row">
                <label className="col-sm-2 col-form-label">전화번호 </label>
                <div className="col-sm-5">
                  <input
                    type="text"
                    name="member_phone"
                    id="member_phone"
                    value={(memInfo && memInfo.member_phone) || ""}
                    onChange={onChange}
                    className="form-control"
                  />
                </div>
              </div>
              <input
                type="hidden"
                name="member_email"
                id="member_email"
                value={(memInfo && memInfo.member_email) || ""}
                onChange={onChange}
                className="form-control"
              />
            </FORM>

            {/* ************적립금사용여부 ************ */}
            <FORM>
              <br />
              <P_SMALL>적립금 사용</P_SMALL>
              <div className="mt-2 mb-2 row">
                <label className="col-sm-2 col-form-label">적립금</label>
                <div className="col-sm-5 d-flex">
                  <input
                    type="number"
                    name="order_used_point"
                    id="order_used_point"
                    onChange={pointChange}
                    value={orderInfo.order_used_point || ""}
                    className="form-control"
                  />
                  <BROWN_BTN onClick={pointUseAll} type="button">
                    모두사용
                  </BROWN_BTN>
                </div>
              </div>
              <div className="mb-4 row">
                <label className="col-sm-2 col-form-label"></label>
                <div className="col-sm-7 d-flex">
                  <span>&nbsp;보유 적립금</span>
                  <POINTSUM>
                    {myPoint.POINT_SUM > 0 ? myPoint.POINT_SUM : 0} P
                  </POINTSUM>
                </div>
              </div>
            </FORM>

            {/* ********************************************************** */}
          </Col>

          <Col xs={6} md={5}>
            <ORDER_WRAPPER>
              <P_SMALL>주문상품 / 총 {payList.length}개</P_SMALL>
              <ORDER_UL>
                {payList.map((pay, i) => (
                  <OrderPageRow key={i} pay={pay} />
                ))}
              </ORDER_UL>

              <hr />

              <div className="d-flex justify-content-left">
                <ORDER_NUM1>총 상품금액</ORDER_NUM1>
                <ORDER_NUM2>
                  {parseInt(orderInfo.order_amount).toLocaleString()}원
                </ORDER_NUM2>
              </div>

              <div className="d-flex justify-content-left">
                <ORDER_NUM1>적립금 사용</ORDER_NUM1>
                <ORDER_NUM2>
                  -&nbsp;
                  {parseInt(orderInfo.order_used_point) > 0
                    ? parseInt(orderInfo.order_used_point).toLocaleString()
                    : 0}
                  원
                </ORDER_NUM2>
              </div>

              <div className="d-flex justify-content-left">
                <ORDER_NUM1>배송비&nbsp; &nbsp; &nbsp; &nbsp;</ORDER_NUM1>
                <ORDER_NUM2>+&nbsp;{shipFee}원</ORDER_NUM2>
              </div>

              <div className="d-flex justify-content-left">
                <ORDER_NUM1>
                  <strong>총 결제금액</strong>
                </ORDER_NUM1>
                <ORDER_P2>
                  {parseInt(orderInfo.order_used_point) > 0
                    ? (
                        parseInt(orderInfo.order_amount) -
                        parseInt(orderInfo.order_used_point) +
                        shipFee
                      ).toLocaleString()
                    : parseInt(orderInfo.order_amount).toLocaleString()}{" "}
                  원
                </ORDER_P2>
              </div>

              <hr />

              <p style={{ margin: "8px 18px" }}>
                주문 내용을 확인했으며, 아래 내용에 동의합니다.
              </p>
              <div className="d-flex">
                <ORDER_CHECK type="checkbox" defaultChecked />
                <ORDER_CHECKS>(필수) 개인정보 수집/이용 동의</ORDER_CHECKS>
              </div>
              <div className="d-flex">
                <ORDER_CHECK type="checkbox" defaultChecked />
                <ORDER_CHECKS>(필수) 개인정보 제3자 제공 동의</ORDER_CHECKS>
              </div>
              <div className="d-flex">
                <ORDER_CHECK type="checkbox" defaultChecked />
                <ORDER_CHECKS>(필수) 결제대행 서비스 이용약관</ORDER_CHECKS>
              </div>

              <div className="d-flex justify-content-center">
                <ORDER_BTN onClick={onClickPayment}>결제하기</ORDER_BTN>
              </div>
            </ORDER_WRAPPER>
          </Col>
        </Row>
      </div>{" "}
      {/* end of container */}
      <Footer />
      {/* 우편번호 모달 */}
      <Modal show={show} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>우편번호 찾기</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <DaumPostcodeEmbed onComplete={handleComplete} {...props} />
        </Modal.Body>
      </Modal>
    </>
  );
};

export default OrderPage;
