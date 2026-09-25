import { HomeNavBar } from '../components/HomeNavBar.tsx';
import { HomepageFooter } from '../components/HomepageFooter.tsx';
import InputField from '../../../components/InputField.tsx';

const Contact = () => {
  return (
    <div className="flex flex-col gap-10 pt-5">
      <header>
        <HomeNavBar />
      </header>
      <main className="flex flex-col gap-10">
        <div>
          <h1 className="text-3xl text-center text-base-400">
            Get in Touch with OmniStore
          </h1>
          <p className="pt-5 text-md text-center text-base-content/80">
            Have questions or need assistance? Our team is here to help. Reach out to us and we'll get back to you
            promptly.
          </p>
        </div>
        <div className="mx-5">
          <section
            className="card max-w-7xl lg:mx-auto bg-base-100 shadow-xl p-8 flex flex-col lg:flex-row gap-10">
            <img src="/images/contact.jpg"
                 className="block rounded-lg w-full lg:w-1/2"
            />
            <form className="flex flex-col gap-4 w-full lg:w-1/2" action="/contact" method="POST">
              <div className="flex flex-row w-full gap-6">
                <InputField label="First Name" name="firstName" type="text" placeholder="Enter your first name"
                            fieldsetClassName="inline w-1/2"
                            inputClassName="bg-base-200 block w-full"
                            required
                />
                <InputField label="Last Name" name="lastName" type="text" placeholder="Enter your last name"
                            fieldsetClassName="inline w-1/2"
                            inputClassName="bg-base-200 block w-full"
                            required
                />
              </div>

              <InputField label="Email" name="email" type="email" placeholder="Enter your email address"
                          inputClassName="bg-base-200 w-full"
                          required
              />
              <fieldset className="fieldset">
                <label htmlFor="message" className="text-base-content/50 mb-2">Message</label>
                <textarea name="message" placeholder="Enter your message"
                          className="textarea textarea-bordered w-full bg-base-200 h-32"
                          required
                />
              </fieldset>
              <button type="submit" className="btn btn-primary mt-4">Send Message</button>
            </form>
          </section>
          <section className="flex flex-col lg:flex-row lg:flex-wrap gap-4 max-w-7xl mx-auto mt-10">
            <a href="mailto:contact@florian-piel.space"
               className="card flex-1 basis-2/5 bg-base-100 shadow-xl p-8 transition transform hover:-translate-y-2 duration-500 hover:text-blue-600">
              <svg xmlns="http://www.w3.org/2000/svg"
                   fill="none"
                   stroke="currentColor"
                   strokeWidth="20"
                   className="text-accent size-10">
                <use href="/icons.svg#email.icon" />
              </svg>
              <p className="mt-4">
                <span className="text-base-content/50">Email Us<br /></span>
                contact@florian-piel.space
              </p>
            </a>
            <a href="tel:+15551234567"
               className="card flex-1 basis-2/5 bg-base-100 shadow-xl p-8 transition transform hover:-translate-y-2 duration-500 hover:text-blue-600">
              <svg xmlns="http://www.w3.org/2000/svg"
                   fill="none"
                   stroke="currentColor"
                   strokeWidth="20"
                   className="text-accent size-10">
                <use href="/icons.svg#phone.icon" />
              </svg>
              <p className="mt-4">
                <span className="text-base-content/50">Call Us<br /></span>
                +1 (555) 123-4567
              </p>
            </a>
            <div
              className="card flex-1 basis-2/5 bg-base-100 shadow-xl p-8 transition transform hover:-translate-y-2 duration-500 hover:text-blue-600">
              <svg xmlns="http://www.w3.org/2000/svg"
                   fill="none"
                   stroke="currentColor"
                   strokeWidth="20"
                   className="text-accent size-10">
                <use href="/icons.svg#location.icon" />
              </svg>
              <p className="mt-4">
                <span className="text-base-content/50">Visit HQ<br /></span>
                123 Main Street, Suite 100
              </p>
            </div>
            <div
              className="card flex-1 basis-2/5 bg-base-100 shadow-xl p-8 transition transform hover:-translate-y-2 duration-500 hover:text-blue-600">
              <svg xmlns="http://www.w3.org/2000/svg"
                   fill="none"
                   stroke="currentColor"
                   strokeWidth="20"
                   className="text-accent size-10">
                <use href="/icons.svg#chat.icon" />
              </svg>
              <p className="mt-4">
                <span className="text-base-content/50">Live Chat<br /></span>
                Available 24/7
              </p>
            </div>
          </section>
        </div>

      </main>
      <footer className="mt-10">
        <HomepageFooter />
      </footer>
    </div>


  );
};

export default Contact;