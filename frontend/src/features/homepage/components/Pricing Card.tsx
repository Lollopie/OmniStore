import { Link } from 'react-router';

interface PricingCardProps {
  title: string;
  subTitle: string;
  price: number;
  features: string[];
}

export default function PricingCard({ title, subTitle, price, features }: PricingCardProps) {
  return (
    <section className="card w-96 bg-base-100 shadow-sm">
      <div className="card-body">
        <h2 className="card-title">{title}</h2>
        <p className="text-lg text-base-content/80">
          {subTitle}
        </p>
        <div className="pt-5">
          <p className="text-3xl font-bold">${price}</p>
          <p className="text-sm text-base-content/60">per month</p>
        </div>
        <ul className="pt-5 space-y-2">
          {features.map((feature) => (
            feature === '' ? <br /> : <li>
              <svg xmlns="http://www.w3.org/2000/svg"
                   width="20"
                   height="20"
                   viewBox="0 0 24 24"
                   fill="none"
                   stroke="currentColor"
                   className="size-4 me-2 inline-block text-success">
                <use href="/icons.svg#check-mark.icon" />
              </svg>
              {feature}
            </li>
          ))}
        </ul>
        <Link to="/register" className="btn btn-primary mt-5">Get Started</Link>
      </div>
    </section>
  );
}