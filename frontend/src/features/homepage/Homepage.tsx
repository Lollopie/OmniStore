import FeatureBox from './components/FeatureBox.tsx';
import { Link } from 'react-router';
import { HomeNavBar } from './components/HomeNavBar.tsx';
import { HomepageFooter } from './components/HomepageFooter.tsx';

const Homepage = () => {
  const images: string[] = Object.values(import.meta.glob('../../assets/companies/*.{png,jpg,jpeg,svg,webp}', {
    eager: true,
    import: 'default',
  }));
  return (
    <div className="flex flex-col gap-10 pt-5">
      <header>
        <HomeNavBar />
      </header>
      <main>
        <section className="flex flex-col gap-20 items-center">
          <section className="card max-w-7xl flex flex-col lg:flex-row gap-10 justify-between p-8 items-center
                       bg-base-100 mx-5">
            <section className="flex-1 flex flex-col gap-4 items-start">
              <h1 className="text-3xl text-left text-base-400">
                Total Control Over Your Inventory. Zero Friction for Your Team.
              </h1>
              <p className="text-md text-left text-base-content/80">
                The fast, multi-user warehouse management platform designed for modern operations.
                Track stock, manage permissions, and scale seamlessly. All in real time.
              </p>
              <Link to="/register" className="btn btn-primary mr-5">Get Started</Link>
            </section>
            <img
              src="/images/inventory-light.png"
              alt="Inventory Management Illustration"
              width="600px"
              className="block [html[data-theme='omnistore-dark']_&]:hidden rounded-lg"
            />

            <img
              src="/images/inventory-dark.png"
              alt="Inventory Management Illustration"
              width="600px"
              className="hidden [html[data-theme='omnistore-dark']_&]:block rounded-lg"
            />
          </section>
          <section className="max-w-5xl w-full p-8 flex flex-row gap-10 justify-around
                         text-center">
            <div>
              <p className="border-b-2 border-accent text-3xl font-bold">
                0M+
              </p>
              <p className="text-lg">
                Items Tracked Daily
              </p>
            </div>
            <div>
              <p className="border-b-2 border-accent text-3xl font-bold">
                99.9%
              </p>
              <p className="text-lg">
                Uptime Guarantee
              </p>
            </div>
            <div>
              <p className="border-b-2 border-accent text-3xl font-bold">
                &lt; 500ms
              </p>
              <p className="text-lg">
                Average Query Latency
              </p>
            </div>
          </section>
          <section className="max-w-lvw xl:max-w-7xl overflow-clip flex flex-col gap-10 px-5">
            <h1 className="text-3xl text-center text-wrap text-base-400">
              Trusted by Leading Companies Worldwide
            </h1>
            <section className="flex marquee-wrapper">
              <div className="flex animate-infinite-scroll min-w-max">
                {images.map((src, index) => (
                  <img
                    key={index}
                    src={src}
                    alt={`Gallery item ${index + 1}`}
                    className="mx-2"
                    style={{ height: '200px', objectFit: 'cover', borderRadius: '8px' }}
                  />
                ))}
              </div>
              <div className="flex animate-infinite-scroll min-w-max" aria-hidden="true">
                {images.map((src, index) => (
                  <img
                    key={index}
                    src={src}
                    alt={`Gallery item ${index + 1}`}
                    className="mx-2"
                    style={{ height: '200px', objectFit: 'cover', borderRadius: '8px' }}
                  />
                ))}
              </div>
            </section>
          </section>
          <section className="card max-w-lvw xl:max-w-7xl py-12 px-8 flex flex-col gap-10 bg-base-100 mx-5">
            <h1 className="text-3xl text-center text-base-400">
              Features
            </h1>
            <section className="flex flex-row flex-wrap gap-5 justify-around w-full">
              <FeatureBox svgName="house.icon" text="Multi-Warehouse Management" />
              <FeatureBox svgName="role.icon" text="Role-Based Access Control" />
              <FeatureBox svgName="rls.icon" text="Row-Level Security" />
              <FeatureBox svgName="boxes.icon" text="Real-Time Inventory Tracking" />
            </section>
            <Link to={'/features'} className="btn btn-accent btn-lg w-full sm:w-96 mx-auto">
              Learn More
            </Link>
          </section>
          <section className="card max-w-lvw xl:max-w-7xl bg-base-100 p-8 mx-5">
            <p className="text-4xl text-base-400 p-5 md:p-15">
              "OmniStore transformed how our warehouse team operates.
              The role-based permissions mean our floor staff move fast without risking data integrity,
              and the app interface is insanely responsive."
            </p>
            <p className="text-2xl text-right font-medium pb-2">
              - Marcus Vance | Head of Logistics at Apex Fulfillment
            </p>
          </section>
        </section>
      </main>
      <footer className="mt-10">
        <HomepageFooter />
      </footer>
    </div>


  );
};

export default Homepage;