const DEFAULT_PRODUCTS = [
  {
    id: 101,
    title: "กล่องสุ่มหัวใจรักหวานแหวว",
    price: 50,
    stock: 10,
    img: "https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=400",
    details: "LOVE-CODE-888999"
  },
  {
    id: 102,
    title: "แหวนคู่รักไอเทมระดับตำนาน",
    price: 100,
    stock: 5,
    img: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400",
    details: "RING-LOVE-555222"
  },
  {
    id: 103,
    title: "ช่อดอกกุหลาบสีชมพูส่งตรงจากใจ",
    price: 300,
    stock: 3,
    img: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400",
    details: "ROSE-PINK-777111"
  },
  {
    id: 104,
    title: "ตุ๊กตาหมีขนาดใหญ่แทนความห่วงใย",
    price: 500,
    stock: 2,
    img: "https://images.unsplash.com/photo-1559454403-b8fb88521f11?w=400",
    details: "BEAR-BIG-100200"
  }
];

function getProducts() {
  const data = localStorage.getItem('products_db');
  if (!data) {
    localStorage.setItem('products_db', JSON.stringify(DEFAULT_PRODUCTS));
    return DEFAULT_PRODUCTS;
  }
  return JSON.parse(data);
}

function saveProducts(products) {
  localStorage.setItem('products_db', JSON.stringify(products));
}
