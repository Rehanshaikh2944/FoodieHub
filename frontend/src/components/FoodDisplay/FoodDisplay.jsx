
import { useContext } from 'react'
import './FoodDisplay.css'
import { StoreContext, getFoodImageUrl } from '../../context/StoreContext'
import FoodItem from '../FoodItem/Fooditem'

const FoodDisplay = ({ category, searchTerm = '' }) => {
  const { food_list, foodLoading, foodError } = useContext(StoreContext)
  const normalizedQuery = searchTerm.trim().toLowerCase();

  const filteredFood = food_list.filter((item) => {
    const matchesCategory = category === 'All' || category === item.category;
    if (!matchesCategory) return false;
    if (!normalizedQuery) return true;

    const haystack = `${item.name} ${item.description || ''} ${item.category || ''}`.toLowerCase();
    return haystack.includes(normalizedQuery);
  });

  return (
    <div className='food-display' id='food-display'>
      <h2>Top dishes near you</h2>
      {foodLoading && <p role="status">Loading the menu…</p>}
      {!foodLoading && foodError && <p role="alert">{foodError}. Make sure the backend and MongoDB are running.</p>}
      {!foodLoading && !foodError && food_list.length === 0 && <p>No food items are available yet. Add items from the admin panel.</p>}
      {!foodLoading && !foodError && normalizedQuery && filteredFood.length === 0 && (
        <p>No dishes match “{searchTerm}”. Try another ingredient, meal, or category.</p>
      )}
      <div className="food-display-list">
        {filteredFood.map((item, index) => (
          <FoodItem
            key={item._id || index}
            id={item._id}
            name={item.name}
            description={item.description}
            price={item.price}
            image={getFoodImageUrl(item.image)}
          />
        ))}
      </div>
    </div>
  )
}

export default FoodDisplay
