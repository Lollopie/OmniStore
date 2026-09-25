import { HomeNavBar } from '../components/HomeNavBar.tsx';
import PricingCard from '../components/Pricing Card.tsx';
import { HomepageFooter } from '../components/HomepageFooter.tsx';

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
          <PricingCard title={'Starter'}
                       subTitle={'For small teams getting organized'}
                       price={29}
                       features={[
                         '1 warehouse',
                         'Up to 5 users',
                         'Role-based access control',
                         'Real-time inventory tracking',
                         'Email support',
                       ]}
          />
          <PricingCard title={'Growth'}
                       subTitle={'For multi-warehouse operations'}
                       price={99}
                       features={[
                         'Up to 5 warehouses',
                         'Up to 25 users',
                         'Everything in Starter',
                         'Priority support',
                         '',
                       ]}
          />
          <PricingCard title={'Enterprise'}
                       subTitle={'For large-scale logistics teams'}
                       price={299}
                       features={[
                         'Unlimited warehouses',
                         'Unlimited users',
                         'Everything in Growth',
                         'Dedicated account manager',
                         'SLA guarantee',
                       ]}
          />
        </section>
      </main>
      <footer>
        <HomepageFooter />
      </footer>
    </div>


  );
};

export default Pricing;