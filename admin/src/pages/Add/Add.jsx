import { useState } from 'react';
import { assets } from '../../assets/assets';
import './Add.css';
import api, { API_URL } from '../../utils/api';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const defaultForm = {
  name: '',
  description: '',
  price: '',
  category: 'Salad',
};

const Add = () => {
  const [image, setImage] = useState(null);
  const [data, setData] = useState(defaultForm);
  const [submitting, setSubmitting] = useState(false);

  const onChangeHandler = (event) => {
    const { name, value } = event.target;
    setData((current) => ({ ...current, [name]: value }));
  };

  const onSubmitHandler = async (event) => {
    event.preventDefault();

    if (!image) {
      toast.error('Please select an image for the menu item.');
      return;
    }

    if (!data.name.trim() || !data.description.trim()) {
      toast.error('Please fill in the item name and description.');
      return;
    }

    const priceValue = Number(data.price);
    if (!Number.isFinite(priceValue) || priceValue < 0) {
      toast.error('Enter a valid non-negative price.');
      return;
    }

    const formData = new FormData();
    formData.append('name', data.name.trim());
    formData.append('description', data.description.trim());
    formData.append('price', String(priceValue));
    formData.append('category', data.category);
    formData.append('image', image);

    try {
      setSubmitting(true);
      const response = await api.post(`${API_URL}/api/food/add`, formData);

      if (response.data.success) {
        setData(defaultForm);
        setImage(null);
        toast.success(response.data.message || 'Food item added successfully.');
      } else {
        toast.error(response.data.message || 'Could not add food.');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not add food. Check the API and your admin session.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="add-page">
      <div className="page-header">
        <div>
          <span className="section-kicker">Menu management</span>
          <h2>Add new item</h2>
        </div>
      </div>

      <form className="add-form" onSubmit={onSubmitHandler}>
        <div className="add-image-panel">
          <p>Food image</p>
          <label htmlFor="image" className="upload-box">
            <img
              src={image ? URL.createObjectURL(image) : assets.upload_area}
              alt="Upload preview"
            />
          </label>
          <input
            onChange={(event) => setImage(event.target.files?.[0] || null)}
            type="file"
            id="image"
            accept="image/*"
            hidden
            required
          />
          <small>PNG, JPG, or WEBP recommended</small>
        </div>

        <div className="add-fields">
          <div className="field-block">
            <label htmlFor="name">Product name</label>
            <input
              id="name"
              onChange={onChangeHandler}
              value={data.name}
              type="text"
              name="name"
              placeholder="Type food name"
              required
            />
          </div>

          <div className="field-block">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              onChange={onChangeHandler}
              value={data.description}
              name="description"
              rows="5"
              placeholder="Write a short product description"
              required
            />
          </div>

          <div className="field-row">
            <div className="field-block">
              <label htmlFor="category">Category</label>
              <select id="category" onChange={onChangeHandler} value={data.category} name="category">
                <option value="Salad">Salad</option>
                <option value="Rolls">Rolls</option>
                <option value="Desserts">Desserts</option>
                <option value="Sandwich">Sandwich</option>
                <option value="Cake">Cake</option>
                <option value="Pure Veg">Pure Veg</option>
                <option value="Pasta">Pasta</option>
                <option value="Noodles">Noodles</option>
              </select>
            </div>

            <div className="field-block">
              <label htmlFor="price">Price</label>
              <input
                id="price"
                onChange={onChangeHandler}
                value={data.price}
                type="number"
                min="0"
                step="0.01"
                name="price"
                placeholder="₹299"
                required
              />
            </div>
          </div>

          <button type="submit" className="admin-primary-button add-submit" disabled={submitting}>
            {submitting ? 'Adding item…' : 'Add item'}
          </button>
        </div>
      </form>
    </section>
  );
};

export default Add;
