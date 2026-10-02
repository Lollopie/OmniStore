import { HomeNavBar } from '../components/HomeNavBar.tsx';
import PricingCard from '../components/Pricing Card.tsx';
import { HomepageFooter } from '../components/HomepageFooter.tsx';
import { PRICING_PLANS } from '../pricingPlans.ts';

const Pricing = () => {
  return (
    <div className="flex flex-col gap-10 pt-5">
      <header>
        <HomeNavBar />
      </header>
      <main>
        <h1 className="text-3xl text-center text-base-400">
          Pricing Plans for Every Business Size
        </h1>
        <p className="pt-5 text-md text-center text-base-content/80">
          Choose the plan that fits your business needs. Scale seamlessly as you grow.
        </p>
        <section className="flex gap-10 flex-col lg:flex-row justify-between items-center max-w-7xl mx-auto p-8">
          {PRICING_PLANS.map((plan) => (
            <PricingCard key={plan.id}
                         title={plan.title}
                         subTitle={plan.subTitle}
                         price={plan.price}
                         features={plan.features}
            />
          ))}
        </section>
      </main>
      <footer>
        <HomepageFooter />
      </footer>
    </div>


  );
};

export default Pricing;
