import { HomeNavBar } from '../components/HomeNavBar.tsx';
import { HomepageFooter } from '../components/HomepageFooter.tsx';

const Features = () => {
  return (
    <div className="flex flex-col gap-10 pt-5">
      <header>
        <HomeNavBar />
      </header>
      <main>
        <h1 className="text-3xl text-center text-base-400">
          Explore OmniStore's Powerful Feature Set
        </h1>
        <p className="pt-5 text-md text-center text-base-content/80">
          From Starter essentials to Enterprise scalability, manage your inventory with precision.
        </p>
        <section className="flex gap-10 flex-col lg:flex-row justify-start max-w-7xl mx-auto p-8">
          <section className="flex gap-10 flex-col justify-between lg:max-w-1/2">
            <div className="card w-full bg-base-100 shadow-xl">
              <div className="card-body flex flex-row justify-between items-center">
                <section>
                  <h2 className="card-title">Multi-Warehouse Management</h2>
                  <p>Running more than one location shouldn't mean juggling separate spreadsheets or
                    logins.
                    See stock levels across every warehouse from a single dashboard,
                    and drill into any location for a closer look. All in real time.</p>
                </section>
                <aside className="min-w-16 h-24 ml-5">
                  <svg xmlns="http://www.w3.org/2000/svg"
                       fill="none"
                       stroke="currentColor"
                       strokeWidth="20"
                       className="text-accent size-10 relative">
                    <use href="/icons.svg#house.icon" />
                  </svg>
                  <svg xmlns="http://www.w3.org/2000/svg"
                       fill="none"
                       stroke="currentColor"
                       strokeWidth="20"
                       className="text-accent size-10 relative right-5">
                    <use href="/icons.svg#house.icon" />
                  </svg>
                  <svg xmlns="http://www.w3.org/2000/svg"
                       fill="none"
                       stroke="currentColor"
                       strokeWidth="20"
                       className="text-accent size-10 relative bottom-10 left-5">
                    <use href="/icons.svg#house.icon" />
                  </svg>
                </aside>
              </div>
            </div>
            <div className="card w-full bg-base-100 shadow-xl">
              <div className="card-body flex flex-row items-center justify-between">
                <section>
                  <h2 className="card-title">Role-Based Access Control</h2>
                  <p>Not everyone on your team needs the same level of access.
                    Assign roles so warehouse staff can manage stock without touching sensitive settings,
                    while admins retain full control. All from one dashboard. </p>
                </section>
                <aside>
                  <svg xmlns="http://www.w3.org/2000/svg"
                       fill="none"
                       stroke="currentColor"
                       strokeWidth="15"
                       className="text-accent size-15">
                    <use href="/icons.svg#role.icon" />
                  </svg>
                </aside>
              </div>
            </div>
          </section>
          <section className="flex gap-10 lg:max-w-1/2 flex-col justify-between">
            <div className="card w-full bg-base-100 shadow-xl">
              <div className="card-body flex flex-row items-center justify-between">
                <section>
                  <h2 className="card-title">Real-Time Inventory Tracking</h2>
                  <p>When a pick, a shipment, or a stock adjustment happens, everyone who needs to know sees it
                    immediately.
                    No waiting for a nightly sync or a manual refresh.
                    What's on the shelf is what's on the screen.</p>
                </section>
                <aside>
                  <svg xmlns="http://www.w3.org/2000/svg"
                       fill="none"
                       stroke="currentColor"
                       strokeWidth="15"
                       className="text-accent size-15">
                    <use href="/icons.svg#boxes.icon" />
                  </svg>
                </aside>
              </div>
            </div>
            <div className="card w-full bg-base-100 shadow-xl">
              <div className="card-body flex flex-row items-center justify-between">
                <section>
                  <h2 className="card-title">Row-Level Security</h2>
                  <p>Your data is isolated at the database level, not just hidden behind a login screen.
                    Even if application code has a bug, the database itself enforces that one company's inventory can
                    never be seen by another.</p>
                </section>
                <aside>
                  <svg xmlns="http://www.w3.org/2000/svg"
                       fill="none"
                       stroke="currentColor"
                       strokeWidth="15"
                       className="text-accent size-15">
                    <use href="/icons.svg#rls.icon" />
                  </svg>
                </aside>
              </div>
            </div>
          </section>
        </section>
      </main>
      <footer>
        <HomepageFooter />
      </footer>
    </div>


  );
};

export default Features;