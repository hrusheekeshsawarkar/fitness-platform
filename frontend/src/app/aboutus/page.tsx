"use client";

import React from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';

interface TeamMember {
  name: string;
  role: string;
  bio: string;
  image: string;
}

export default function AboutUsPage() {
  const teamMembers: TeamMember[] = [
    {
      name: "Pradeep Senapati",
      role: "Founder & Lead Runner",
      bio: "Passionate marathon runner with over 10 years of experience in organizing fitness events. Pradeep founded Run2Rejuvenate with the vision of creating a supportive community for runners of all levels.",
      image: "/r2r_logo.jpg", // Placeholder, ideally would be an actual team member photo
    }
    // {
    //   name: "Priya Patel",
    //   role: "Fitness Coach & Nutritionist",
    //   bio: "Certified fitness coach and nutritionist specializing in runner's nutrition. Priya has helped hundreds of runners optimize their diet and training regimens for maximum performance.",
    //   image: "/r2r_logo.jpg", // Placeholder, ideally would be an actual team member photo
    // },
    // {
    //   name: "Arjun Mehta",
    //   role: "Community Manager",
    //   bio: "Former competitive runner who now focuses on building and nurturing the R2R community. Arjun organizes weekly group runs and ensures everyone feels welcome regardless of their fitness level.",
    //   image: "/r2r_logo.jpg", // Placeholder, ideally would be an actual team member photo
    // },
  ];

  return (
    <div className="py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">About Run2Rejuvenate</h1>
        
        {/* Our Story Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Our Story</h2>
          <div className="prose max-w-none">
            <p className="mb-4">
              Run2Rejuvenate began in 2019 as a small group of friends who shared a passion for running and wellness. What started as weekend meetups in local parks has grown into a vibrant community of fitness enthusiasts across India and abroad.
            </p>
            <p className="mb-4">
              We recognized that in today's increasingly sedentary world, many people struggle with health issues related to inactivity - from cardiovascular problems to mental health challenges. Our founders believed that running could be a powerful, accessible solution to many of these issues.
            </p>
            <p>
              Today, Run2Rejuvenate has evolved into a platform that not only encourages running but embraces a holistic approach to fitness that includes walking, riding, yoga, and more. We've organized countless events, built a supportive online community, and helped thousands of people transform their lives through consistent physical activity.
            </p>
          </div>
        </section>
        
        {/* Mission and Values */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Our Mission and Values</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-xl font-medium mb-2">Our Mission</h3>
                <p>
                  To create an inclusive fitness community that empowers individuals to achieve physical and mental wellness through running and related activities, regardless of their starting point or athletic background.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-xl font-medium mb-2">Our Values</h3>
                <ul className="space-y-2">
                  <li><strong>Inclusivity:</strong> Welcome runners of all levels</li>
                  <li><strong>Community:</strong> Foster supportive relationships</li>
                  <li><strong>Consistency:</strong> Promote regular activity</li>
                  <li><strong>Education:</strong> Share knowledge about fitness</li>
                  <li><strong>Balance:</strong> Embrace holistic wellness</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>
        
        {/* What We Do */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">What We Do</h2>
          <div className="prose max-w-none mb-6">
            <p>
              At Run2Rejuvenate, we're committed to supporting your fitness journey in multiple ways:
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-medium mb-2">Group Activities</h3>
                <p>We organize weekly group runs and walks in various locations, creating a supportive environment for exercising together.</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-medium mb-2">Virtual Events</h3>
                <p>Our virtual running events allow participants to join from anywhere, tracking progress and earning recognition.</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-medium mb-2">Education</h3>
                <p>Regular workshops and articles on running techniques, nutrition, injury prevention, and mental wellness.</p>
              </CardContent>
            </Card>
          </div>
        </section>
        
        {/* Meet Our Team */}
        <section>
          <h2 className="text-2xl font-semibold mb-6 text-center">Meet Our Team</h2>
          <div className="grid md:grid-cols-3 gap-8 place-items-center">
            {teamMembers.map((member, index) => (
              <div key={index} className="text-center max-w-xs">
                <div className="relative w-32 h-32 mx-auto mb-4 overflow-hidden rounded-full">
                  <Image
                    src={member.image}
                    alt={member.name}
                    fill
                    style={{ objectFit: 'cover' }}
                  />
                </div>
                <h3 className="text-xl font-medium text-center">{member.name}</h3>
                <p className="text-primary mb-2 text-center">{member.role}</p>
                <p className="text-sm text-muted-foreground text-center">{member.bio}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
