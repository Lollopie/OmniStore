import Logo from '../../components/Logo.tsx';

const Homepage = () => {
  return (
    <div>
      <header className="max-w-4xl flex justify-center pt-4">
        <nav className="flex items-center justify-between bg-base-200">
          <Logo />
        </nav>
      </header>
      <main>
        <section className="max-w-3xl">
          <h1 className="text-6xl text-left text-base-400">
            The inventory management solution for your organization.
          </h1>
        </section>
      </main>
    </div>

  );
};

export default Homepage;