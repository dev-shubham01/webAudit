import React from 'react'
import {
  Search,
  TrendingUp,
  FileSearch,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { Link } from 'react-router-dom';
import Button from '../../components/ui/button';
import Input from '../../components/ui/input';
import { features } from '../../data/data';
import { Card, CardContent } from '../../components/ui/card';


const Landing = () => {
    
  return (
    <div className="h-screen">
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#6366F1]">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-semibold text-white">WebHealth</span>
          </div>
          <Link to="/dashboard">
            <Button
              variant="outline"
              className="border-[#334155] text-[#E2E8F0] hover:bg-[#1E293B]"
            >
              Sign In
            </Button>
          </Link>
        </div>
      </header>
      <section className="mx-auto max-w-7xl px-8 py-24">
        <div className="text-center">
          <h1 className="mb-6 text-5xl font-bold tracking-tight text-white">
            AI-powered Website Health &<br />
            Debugging Platform
          </h1>
          <p className="mx-auto mb-12 max-w-2xl text-lg text-[#94A3B8]">
            Analyze your website's performance, SEO, errors, and security in
            real-time. Get AI-powered insights and automatic fixes to optimize
            your web presence.
          </p>
          <div className="mx-auto flex max-w-2xl items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#94A3B8]" />
              <Input
                type="url"
                placeholder="https://yourwebsite.com"
                className="h-14 w-full rounded-xl border border-[#334155] bg-[#1E293B] pl-12 text-lg text-[#E2E8F0] placeholder:text-[#94A3B8] focus:border-[#6366F1] focus:ring-2 focus:ring-[#6366F1]"
              />
            </div>
            <Link to="/dashboard">
              <Button className="h-14 rounded-xl bg-[#6366F1] px-8 text-lg text-white hover:bg-[#5558E3] cursor-pointer">
                Analyze Now
              </Button>
            </Link>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-8 py-16">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card
                key={feature.title}
                className="border-[#334155] bg-[#1E293B]"
              >
                <CardContent className="p-6">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-[#6366F1]/10">
                    <Icon className="h-6 w-6 text-[#6366F1]" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-white">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-[#94A3B8]">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="mb-4 text-3xl font-bold text-white">
            Powerful Dashboard Analytics
          </h2>
          <p className="text-lg text-[#94A3B8]">
            Track your website's health metrics in real-time
          </p>
        </div>
        <div className="overflow-hidden rounded-xl border border-[#334155] bg-gradient-to-br from-[#1E293B] to-[#0F172A] p-8">
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-[#334155] bg-[#0F172A]">
              <CardContent className="p-6 text-center">
                <div className="text-4xl font-bold text-[#22C55E]">94</div>
                <div className="mt-2 text-sm text-[#94A3B8]">
                  Performance Score
                </div>
              </CardContent>
            </Card>
            <Card className="border-[#334155] bg-[#0F172A]">
              <CardContent className="p-6 text-center">
                <div className="text-4xl font-bold text-[#6366F1]">87</div>
                <div className="mt-2 text-sm text-[#94A3B8]">SEO Score</div>
              </CardContent>
            </Card>
            <Card className="border-[#334155] bg-[#0F172A]">
              <CardContent className="p-6 text-center">
                <div className="text-4xl font-bold text-[#F59E0B]">91</div>
                <div className="mt-2 text-sm text-[#94A3B8]">
                  Stability Score
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#334155] py-8">
        <div className="mx-auto max-w-7xl px-8 text-center text-sm text-[#94A3B8]">
          © 2026 WebHealth. Built for developers who care about performance.
        </div>
      </footer>
    </div>
  );
}

export default Landing
