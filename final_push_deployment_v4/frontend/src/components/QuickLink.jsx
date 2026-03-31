import { Link } from 'react-router-dom';

function QuickLink({ title, to, image }) {
  return (
    <div className="quick-link card">
      <img src={image} alt={title} />
      <h3>{title}</h3>
      <Link to={to}>Go</Link>
    </div>
  );
}

export default QuickLink;