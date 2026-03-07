import { useState, useRef, useEffect } from "react";
import axios from "axios";
import * as bootstrap from "bootstrap";
import "./assets/style.css";

// 建立API設定
const API_BASE = import.meta.env.VITE_API_BASE;
const API_PATH = import.meta.env.VITE_API_PATH;

// 建立狀態管理
const INITIAL_TEMPLATE_DATA = {
  id: "",
  title: "",
  category: "",
  origin_price: "",
  price: "",
  unit: "",
  description: "",
  content: "",
  is_enabled: false,
  imageUrl: "",
  imagesUrl: [],
};

function App() {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [isAuth, setIsAuth] = useState(false);
  const [products, setProducts] = useState([]);
  const [templateProduct, setTemplateProduct] = useState(INITIAL_TEMPLATE_DATA);
  const [modalType, setModalType] = useState("");

  const productModalRef = useRef(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((preData) => ({
      ...preData,
      [name]: value,
    }));
  };

  const handleModalInputChange = (e) => {
    const { name, value, checked, type } = e.target;
    setTemplateProduct((preData) => ({
      ...preData,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // 取得產品列表
  const getProducts = async () => {
    try {
      const response = await axios.get(
        `${API_BASE}/api/${API_PATH}/admin/products`,
      );
      setProducts(response.data.products);
    } catch (error) {
      console.error(error.response);
    }
  };

  //串更新產品API
  const updateProduct = async (id) => {
    let url = `${API_BASE}/api/${API_PATH}/admin/products`;
    let method = "post";
    //編輯
    if (modalType === "edit") {
      url = `${API_BASE}/api/${API_PATH}/admin/products/${id}`;
      method = "put";
    }

    //抓錯誤
    const productData = {
      data: {
        ...templateProduct,
        origin_price: Number(templateProduct.origin_price),
        price: Number(templateProduct.price),
        is_enabled: templateProduct.is_enabled ? 1 : 0,
        imagesUrl: [...templateProduct.imagesUrl.filter((url) => url !== "")],
      },
    };
    try {
      const response = await axios[method](url, productData);
      console.log(response.data);
      getProducts();
      closeModal();
    } catch (error) {
      console.log(error.response);
    }
  };

  //串刪除產品API
  const delProduct = async (id) => {
    try {
      const response = await axios.delete(
        `${API_BASE}/api/${API_PATH}/admin/product/${id}`,
      );
      console.log(response.data);
      {
        /*訊息print到畫面上*/
      }
      getProducts();
      closeModal();
    } catch (error) {
      console.log(error.response);
    }
  };

  //串登入功能API
  const onSubmit = async (e) => {
    try {
      e.preventDefault();
      const response = await axios.post(`${API_BASE}/admin/signin`, formData);
      const { token, expired } = response.data;

      // 寫入 Cookie
      document.cookie = `hexToken=${token}; expires=${new Date(expired).toUTCString()}; path=/`;

      // 設定 Axios 預設 Header
      axios.defaults.headers.common["Authorization"] = token;

      getProducts(); // 登入成功後直接撈資料
      setIsAuth(true); // 切換畫面
      alert("登入成功");
    } catch (error) {
      setIsAuth(false);
      console.error(error.response);
      alert("登入失敗");
    }
  };

  useEffect(() => {
    // 讀取 Cookie
    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("hexToken="))
      ?.split("=")[1];

    if (token) {
      axios.defaults.headers.common["Authorization"] = token;
    }

    productModalRef.current = new bootstrap.Modal("#productModal", {
      keyboard: false,
    });

    // 檢查登入狀態
    const checkLogin = async () => {
      try {
        await axios.post(`${API_BASE}/api/user/check`);
        setIsAuth(true);
        getProducts();
      } catch (error) {
        console.log(error.response?.data.message);
      }
    };
    checkLogin();
  }, []);

  const openModal = (type, product) => {
    setModalType(type);
    setTemplateProduct({
      ...product,
    });
    productModalRef.current.show();
  };

  const closeModal = () => {
    productModalRef.current.hide();
  };

  return (
    <>
      {!isAuth ? (
        <div className="container login">
          <div className="row justify-content-center">
            <h1 className="mb-3 fw-bold text-center">請登入</h1>
            <div className="col-8">
              <form id="form" className="form-signin" onSubmit={onSubmit}>
                <div className="form-floating mb-3">
                  <input
                    type="email"
                    className="form-control"
                    id="username"
                    name="username"
                    placeholder="name@example.com"
                    value={formData.username}
                    onChange={handleInputChange}
                    required
                    autoFocus
                  />
                  <label htmlFor="username">Email address</label>
                </div>
                <div className="form-floating">
                  <input
                    type="password"
                    className="form-control"
                    id="password"
                    name="password"
                    placeholder="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                  />
                  <label htmlFor="password">Password</label>
                </div>

                <div className="container">
                  <div className="row mt-2">
                    <div className="col-12">
                      <button
                        className="btn btn-lg btn-primary w-100 mt-3"
                        type="submit"
                      >
                        登入
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      ) : (
        <div className="container mt-5">
          <div className="row">
            {/* 左邊：產品列表 */}
            <div className="col-md-6">
              <h2 className="fw-bold">產品列表</h2>
              <div className="text-end mt-4">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => openModal("create", INITIAL_TEMPLATE_DATA)}
                >
                  建立新的產品
                </button>
              </div>
              <table className="table">
                <thead>
                  <tr>
                    <th scope="col" className="fw-bold">
                      分類
                    </th>
                    <th scope="col" className="fw-bold">
                      產品名稱
                    </th>
                    <th scope="col" className="fw-bold">
                      原價
                    </th>
                    <th scope="col" className="fw-bold">
                      售價
                    </th>
                    <th scope="col" className="fw-bold">
                      是否啟用
                    </th>
                    <th scope="col" className="fw-bold">
                      編輯
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => {
                    return (
                      <tr key={product.id}>
                        <td className="fw-bold">{product.category}</td>
                        <th scope="row" className="fw-bold">
                          {product.title}
                        </th>
                        <td className="fw-bold">{product.origin_price}</td>
                        <td className="fw-bold">{product.price}</td>
                        <td
                          className={`fw-bold ${product.is_enabled ? "text-success" : ""}`}
                        >
                          {product.is_enabled ? "啟用" : "未啟用"}
                        </td>
                        <td>
                          <div
                            className="btn-group"
                            role="group"
                            aria-label="Basic example"
                          >
                            <button
                              type="button"
                              className="btn btn-outline-primary btn-sm"
                              onClick={() => openModal("edit", product)}
                            >
                              編輯
                            </button>
                            <button
                              type="button"
                              className="btn btn-outline-danger btn-sm"
                              onClick={() => openModal("delete", product)}
                            >
                              刪除
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {/* 右邊：產品細節 */}
            <div className="col-md-6">
              <h2 className="fw-bold">產品明細</h2>
              {templateProduct.title ? (
                <div className="card">
                  {templateProduct.imageUrl && (
                    <img
                      src={templateProduct.imageUrl}
                      className="card-img-top"
                      alt="主圖"
                    />
                  )}
                  <div className="card-body">
                    <h5 className="card-title fw-bold">
                      {templateProduct.title}
                      <span className="badge bg-primary ms-2">
                        {templateProduct.category}
                      </span>
                    </h5>
                    <p className="card-text">
                      商品描述: {templateProduct.description}
                    </p>
                    <p className="card-text">
                      商品內容: {templateProduct.content}
                    </p>
                    <div className="d-flex">
                      <p className="card-text text-secondary">
                        <del>{templateProduct.origin_price}</del>
                      </p>
                      元 / {templateProduct.price} 元
                    </div>

                    <h5 className="mt-3 fw-bold">更多圖片：</h5>
                    <div className="d-flex flex-wrap">
                      {templateProduct.imagesUrl?.map((url, index) => (
                        <img
                          key={index}
                          src={url}
                          className="images"
                          style={{
                            width: "150px",
                            height: "100px",
                            objectFit: "cover",
                            marginRight: "10px",
                            marginBottom: "10px",
                          }}
                          alt={`副圖${index + 1}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-secondary">請點擊左側「編輯」按鈕檢視詳情</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/*製作按鍵-Modal*/}
      <div
        className="modal fade"
        id="productModal"
        tabIndex="-1"
        role="dialog"
        aria-labelledby="productModalLabel"
        aria-hidden="true"
        ref={productModalRef}
      >
        <div className="modal-dialog modal-xl">
          <div className="modal-content border-0">
            <div
              className={`modal-header bg-${modalType === "delete" ? "danger" : "dark"} text-white`}
            >
              <h5 id="productModalLabel" className="modal-title">
                <span>
                  {modalType === "delete"
                    ? "刪除"
                    : modalType === "edit"
                      ? "編輯"
                      : "新增"}
                  商品
                </span>
              </h5>
              <button
                type="button"
                className="btn-close btn-close-white"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>
            <div className="modal-body">
              {modalType === "delete" ? (
                <p className="fs-4">
                  確定刪除
                  <sapn className="text-danger">
                    {templateProduct.title}嗎?
                  </sapn>
                </p>
              ) : (
                <div className="row">
                  <div className="col-sm-4">
                    <div className="mb-2">
                      <div className="mb-3">
                        <label htmlFor="imageUrl" className="form-label">
                          主圖網址
                        </label>
                        <input
                          type="text"
                          id="imageUrl"
                          name="imageUrl"
                          className="form-control"
                          placeholder="請輸入主圖連結"
                          value={templateProduct.imageUrl}
                          onChange={handleModalInputChange}
                        />
                      </div>
                      {templateProduct.imageUrl && (
                        <img
                          className="img-fluid mb-3"
                          src={templateProduct.imageUrl}
                          alt="主圖預覽"
                        />
                      )}
                    </div>

                    {/* 副圖區塊 */}
                    <div>
                      <h6 className="fw-bold">副圖網址</h6>
                      {templateProduct.imagesUrl?.map((url, index) => (
                        <div key={index} className="mb-3">
                          <input
                            type="text"
                            className="form-control mb-2"
                            placeholder={`圖片網址 ${index + 1}`}
                            value={url}
                            onChange={(e) => {
                              // 專門處理副圖陣列更新的邏輯
                              const newImagesUrl = [
                                ...templateProduct.imagesUrl,
                              ];
                              newImagesUrl[index] = e.target.value;
                              setTemplateProduct((pre) => ({
                                ...pre,
                                imagesUrl: newImagesUrl,
                              }));
                            }}
                          />
                          {url && (
                            <img
                              className="img-fluid"
                              src={url}
                              alt={`副圖預覽 ${index + 1}`}
                            />
                          )}
                        </div>
                      ))}

                      <button className="btn btn-outline-primary btn-sm d-block w-100 mb-2">
                        新增圖片
                      </button>
                      <button className="btn btn-outline-danger btn-sm d-block w-100">
                        刪除圖片
                      </button>
                    </div>
                  </div>

                  <div className="col-sm-8">
                    <div className="mb-3">
                      <label htmlFor="title" className="form-label">
                        標題
                      </label>
                      <input
                        name="title"
                        id="title"
                        type="text"
                        className="form-control"
                        placeholder="請輸入標題"
                        value={templateProduct.title}
                        onChange={handleModalInputChange}
                      />
                    </div>

                    <div className="row">
                      <div className="mb-3 col-md-6">
                        <label htmlFor="category" className="form-label">
                          分類
                        </label>
                        <input
                          name="category"
                          id="category"
                          type="text"
                          className="form-control"
                          placeholder="請輸入分類"
                          value={templateProduct.category}
                          onChange={handleModalInputChange}
                        />
                      </div>
                      <div className="mb-3 col-md-6">
                        <label htmlFor="unit" className="form-label">
                          單位
                        </label>
                        <input
                          name="unit"
                          id="unit"
                          type="text"
                          className="form-control"
                          placeholder="請輸入單位"
                          value={templateProduct.unit}
                          onChange={handleModalInputChange}
                        />
                      </div>
                    </div>

                    <div className="row">
                      <div className="mb-3 col-md-6">
                        <label htmlFor="origin_price" className="form-label">
                          原價
                        </label>
                        <input
                          name="origin_price"
                          id="origin_price"
                          type="number"
                          min="0"
                          className="form-control"
                          placeholder="請輸入原價"
                          value={templateProduct.origin_price}
                          onChange={handleModalInputChange}
                        />
                      </div>
                      <div className="mb-3 col-md-6">
                        <label htmlFor="price" className="form-label">
                          售價
                        </label>
                        <input
                          name="price"
                          id="price"
                          type="number"
                          min="0"
                          className="form-control"
                          placeholder="請輸入售價"
                          value={templateProduct.price}
                          onChange={handleModalInputChange}
                        />
                      </div>
                    </div>
                    <hr />

                    <div className="mb-3">
                      <label htmlFor="description" className="form-label">
                        產品描述
                      </label>
                      <textarea
                        name="description"
                        id="description"
                        className="form-control"
                        placeholder="請輸入產品描述"
                        value={templateProduct.description}
                        onChange={handleModalInputChange}
                      ></textarea>
                    </div>
                    <div className="mb-3">
                      <label htmlFor="content" className="form-label">
                        說明內容
                      </label>
                      <textarea
                        name="content"
                        id="content"
                        className="form-control"
                        placeholder="請輸入說明內容"
                        value={templateProduct.content}
                        onChange={handleModalInputChange}
                      ></textarea>
                    </div>
                    <div className="mb-3">
                      <div className="form-check">
                        <input
                          name="is_enabled"
                          id="is_enabled"
                          className="form-check-input"
                          type="checkbox"
                          checked={templateProduct.is_enabled}
                          onChange={handleModalInputChange}
                        />
                        <label
                          className="form-check-label"
                          htmlFor="is_enabled"
                        >
                          是否啟用
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              {/*加入串刪除產品API (onclick)*/}
              {modalType === "delete" ? (
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => delProduct(templateProduct.id)}
                >
                  刪除
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    data-bs-dismiss="modal"
                    onClick={closeModal}
                  >
                    取消
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => updateProduct(templateProduct.id)}
                  >
                    確認
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
