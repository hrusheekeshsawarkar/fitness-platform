"use client";

import React from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function WelcomePage() {
  return (
    <div className="py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-6">Welcome to Run2Rejuvenate</h1>
          
          <div className="relative w-full h-[300px] rounded-lg overflow-hidden mb-6">
            <Image 
              src="/r2r_logo.jpg"
              alt="Run2Rejuvenate Hero" 
              fill
              style={{objectFit: 'cover'}}
              className="brightness-90"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60 flex items-end">
              <div className="p-6 text-white">
                <h2 className="text-2xl font-bold">Run to Heal. Run to Feel. Run to Become Real.</h2>
              </div>
            </div>
          </div>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-lg text-muted-foreground leading-relaxed mb-8">
              Run2Rejuvenate (R2R) is more than just a running program – it's a holistic approach to wellness that combines the physical benefits of running with mental and emotional rejuvenation. Our community-driven platform helps you transform your running routine into a journey of self-discovery and personal growth.
            </p>

            <h2 className="text-2xl font-semibold mt-8 mb-4">Welcome</h2>
            <p className="mb-8 text-lg">
            Welcome to <span className="font-bold">"Run2Rejuvenate, Let’s celebrate Fitness Together"</span>. This is a platform through which we unlock and unleash our full potential to stay Fit and Healthy. We (Run2Rejuvenate) are a family of fitness enthusiasts across India and abroad, who want to stay fit and healthy forever through Running, Walking, Riding, Yoga, Gym and Zumba.
            </p>
            
            <h2 className="text-2xl font-semibold mt-8 mb-4">Our Mission</h2>
            <p className="mb-6">
              At Run2Rejuvenate, we believe that running is one of the most accessible and powerful tools for transformation. Our mission is to create a supportive community where runners of all levels can challenge themselves, track their progress, and experience the profound rejuvenating effects of consistent physical activity.
            </p>
            
            <h2 className="text-2xl font-semibold mt-8 mb-4">Why Run2Rejuvenate?</h2>
            <div className="grid md:grid-cols-2 gap-6 mt-6">
              <div className="bg-card p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-medium mb-2">Physical Benefits</h3>
                <ul className="space-y-2">
                  <li>• Improved cardiovascular health</li>
                  <li>• Enhanced muscle strength and endurance</li>
                  <li>• Weight management</li>
                  <li>• Better sleep patterns</li>
                  <li>• Increased energy levels</li>
                </ul>
              </div>
              <div className="bg-card p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-medium mb-2">Mental Wellness</h3>
                <ul className="space-y-2">
                  <li>• Stress reduction</li>
                  <li>• Improved mood and mental clarity</li>
                  <li>• Boost in self-confidence</li>
                  <li>• Community connection</li>
                  <li>• Mindfulness practice</li>
                </ul>
              </div>
            </div>
            
            <h2 className="text-2xl font-semibold mt-8 mb-4">Get Started Today</h2>
            <p className="mb-6">
              Whether you're a seasoned marathon runner or just taking your first steps toward a more active lifestyle, Run2Rejuvenate welcomes you. Join our community events, track your progress, and experience the transformation that comes from committing to your physical and mental wellbeing.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 mt-8">
              <Link href="/events">
                <Button size="lg" className="w-full sm:w-auto">
                  Explore Events
                </Button>
              </Link>
              <Link href="/auth/login">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Join Our Community
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 