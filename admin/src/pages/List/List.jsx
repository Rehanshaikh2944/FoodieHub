import { useCallback, useEffect, useMemo, useState } from 'react';
import './List.css';
import api, { API_URL } from '../../utils/api';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const List = () => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchList = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`${API_URL}/api/food/list`);

      if (response.data.success) {
        setList(response.data.data || []);
      } else {
        toast.error(response.data.message || 'Error');
      }
    } catch (error) {
      toast.error('Something went wrong while fetching the food list.');
    } finally {
      setLoading(false);
    }
  }, []);

  const removeFood = async (foodId) => {
    try {
      const response = await api.post(`${API_URL}/api/food/remove`, { id: foodId });

      if (response.data.success) {
        toast.success(response.data.message || 'Food item removed.');
        fetchList();
      } else {
        toast.error(response.data.message || 'Failed to remove food');
      }
    } catch (error) {
      toast.error('Something went wrong while removing the food item.');
    }
  };

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const filteredList = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return list;

    return list.filter((item) => {
      const name = String(item.name || '').toLowerCase();
      const category = String(item.category || '').toLowerCase();
      return name.includes(query) || category.includes(query);
    });
  }, [list, search]);

  return (
    <section className="admin-list-page">
      <div className="page-header">
        <div>
          <span className="section-kicker">Menu catalog</span>
          <h2>Food items</h2>
        </div>
        <button type="button" className="admin-secondary-button" onClick={fetchList}>
          Refresh
        </button>
      </div>

      <div className="list-toolbar">
        <label className="admin-search-box">
          <span>⌕</span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name or category"
          />
        </label>
        <div className="list-summary">{list.length} items</div>
      </div>

      {loading ? (
        <div className="admin-empty-state compact">
          <p>Loading menu items…</p>
        </div>
      ) : filteredList.length === 0 ? (
        <div className="admin-empty-state">
          <h3>No menu items found</h3>
          <p>{list.length ? 'Try another search term.' : 'Add your first menu item to get started.'}</p>
        </div>
      ) : (
        <div className="list-table">
          <div className="list-table-format title">
            <b>Image</b>
            <b>Name</b>
            <b>Category</b>
            <b>Price</b>
            <b>Action</b>
          </div>

          {filteredList.map((item, index) => (
            <div key={item._id || index} className="list-table-format">
              <img
                src={`${API_URL}/images/${item.image}`}
                onError={(event) => {
                  event.currentTarget.style.visibility = 'hidden';
                }}
                alt={item.name}
              />
              <p>{item.name}</p>
              <p>{item.category}</p>
              <p>₹{Number(item.price || 0).toLocaleString('en-IN')}</p>
              <button
                type="button"
                className="admin-delete-button"
                aria-label={`Remove ${item.name}`}
                onClick={() => {
                  if (window.confirm(`Remove ${item.name}? This cannot be undone.`)) {
                    removeFood(item._id);
                  }
                }}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default List;
