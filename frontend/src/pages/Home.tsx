import React from 'react';
import { Link } from 'react-router-dom';
import {
  Accessibility,
  BadgeCheck,
  MapPinned,
  Mic,
  ScanSearch,
  Users,
} from 'lucide-react';

const Home: React.FC = () => {
  return (
    <div className="bg-slate-50">
      <section className="bg-gradient-to-br from-slate-950 via-blue-950 to-emerald-900 py-20 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <span className="inline-flex rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-blue-100">
                Accessibility is not one-size-fits-all
              </span>
              <h1 className="mt-6 text-4xl font-bold leading-tight sm:text-5xl">
                Huruspaces gives every person the freedom to access spaces
                independently and confidently.
              </h1>
              <p className="mt-6 max-w-2xl text-lg text-blue-100">
                Discover, evaluate, and contribute accessibility information for
                restaurants, offices, venues, and public spaces using a system
                designed for touch, voice-ready interaction, and assistive tech.
              </p>
              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <Link
                  to="/places"
                  className="rounded-full bg-white px-6 py-4 text-center text-base font-semibold text-slate-900 transition hover:bg-slate-100"
                >
                  Explore accessible places
                </Link>
                <Link
                  to="/register"
                  className="rounded-full border border-white/30 px-6 py-4 text-center text-base font-semibold text-white transition hover:bg-white/10"
                >
                  Create accessibility profile
                </Link>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/10 p-6 backdrop-blur">
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  {
                    icon: Accessibility,
                    title: 'Personalized access',
                    text: 'Results adapt to mobility, visual, hearing, cognitive, and temporary needs.',
                  },
                  {
                    icon: MapPinned,
                    title: 'Place discovery',
                    text: 'Find spaces with pins, filters, reviews, and clear access summaries.',
                  },
                  {
                    icon: Users,
                    title: 'Community powered',
                    text: 'Crowdsourced place additions keep the map practical and alive.',
                  },
                  {
                    icon: Mic,
                    title: 'Voice-ready',
                    text: 'Designed so hands-free and assistive-tech flows can grow naturally.',
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="rounded-3xl border border-white/10 bg-slate-950/20 p-5"
                  >
                    <item.icon className="text-emerald-300" size={24} />
                    <h3 className="mt-4 text-lg font-semibold">{item.title}</h3>
                    <p className="mt-2 text-sm text-blue-100">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-slate-900">
              Huruspaces MVP
            </h2>
            <p className="mx-auto mt-3 max-w-3xl text-lg text-slate-600">
              Start with community place discovery, accessibility profiles,
              filters, map preview, place details, and community submissions.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              {
                icon: ScanSearch,
                title: 'Discover places',
                text: 'Search and filter accessible places using personalized needs and feature tags.',
              },
              {
                icon: BadgeCheck,
                title: 'Evaluate confidence',
                text: 'See accessibility scores, proof images, and community reviews in one place.',
              },
              {
                icon: Users,
                title: 'Contribute data',
                text: 'Add new locations and accessibility features so the platform keeps growing.',
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="inline-flex rounded-2xl bg-blue-50 p-3 text-blue-700">
                  <item.icon size={22} />
                </div>
                <h3 className="mt-5 text-xl font-semibold text-slate-900">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
