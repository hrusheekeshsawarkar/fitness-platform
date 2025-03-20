"use client";

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';

interface Sponsor {
  name: string;
  logoPath: string;
  description: string;
  url: string;
}

export default function WellWishersPage() {
  const sponsors: Sponsor[] = [
    {
      name: "Foodio.fit",
      logoPath: "/sponsors/foodio.png",
      description: "India's First Healthy Portable Beverage brand started by a Food Technologist who is the creator of many commercially successful health Brand's in healthy packaged food Space. i'm Tender Coconut Water, i'm Sugarcane Juice, i'm Mango Juice, i'm Guava Juice, At Foodio fit taste meets health and that is why we believe that this is the one and only brand where The Heart (taste) and the Stomach (health) meet. Looking for healthy Options. This is your one stop solution. Discover a wide range of food products, snacks boxes, and India foods for burning fat near you at Foodio. We offer healthy beverages and vegetable chips.",
      url: "https://www.foodio.fit/",
    },
    {
      name: "FALCA eSolutions",
      logoPath: "/sponsors/falca.png",
      description: "Falca is a rural AgTech supply chain startup offering one-stop solution for all farming needs. Falca aims to enhance the farmer lifecycle through farmer centric phygital (Physical + Digital) platform by providing Input Solutions, Advisory Solutions and Market Linkages.",
      url: "https://www.instagram.com/falca_solutions/",
    },
    {
      name: "XYXX Apparels",
      logoPath: "/sponsors/xyxx.png",
      description: "Established in 2017, XYXX crafts innovation driven, contemporary innerwear and comfort wear for men. Designed to impress and built to last, we are on a journey to help you win the war against discomfort while looking boss-some! Visit us or shop at our stores in Surat, Mumbai, Bangalore and Indore.",
      url: "https://xyxxcrew.com/",
    },
    {
      name: "Zing Technologies",
      logoPath: "/sponsors/zing.png",
      description: "Aviation and Aerospace Component Manufacturing.",
      url: "https://www.linkedin.com/company/zingtechnologies/?originalSubdomain=in",
    },
    {
      name: "Walnut (Early Support)",
      logoPath: "/sponsors/walnut.png",
      description: "Walnut Early Supports is a web based – digital resource that is created by nationally and internationally certified Speech Language Pathologists (SLPs) for parents, SLPs and the Special Education Fraternity who treat individuals with Speech/Language, Cognitive, Behavioral, and Social/Emotional difficulties. This platform is an all-inclusive – one stop solution to cater to the needs of individuals with disabilities. Our platform offers over 2500+ therapy materials for speech language development, phonological development, speech sound and articulation errors, social-pragmatic development, emotional and behavioral regulation, special education-reading, writing and math, phonological awareness and cognitive weaknesses in areas of attention, memory, processing speed and sex education for special needs individuals.",
      url: "https://www.walnutearlysupports.com",
    },
    {
      name: "Sculpting Lifestyle",
      logoPath: "/sponsors/sculpting.png",
      description: "Make your Food a Medicine and Heal with Sculpting Lifestyle.",
      url: "https://sculptinglifestyle.in/",
    },
  ];

  return (
    <div className="py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Our Well Wishers</h1>
        
        <div className="prose max-w-none mb-8">
          <p className="text-lg text-muted-foreground">
            We're grateful to our sponsors and partners who support the Run2Rejuvenate community. Their contributions help us organize events, provide resources, and create a better experience for all our members.
          </p>
        </div>
        
        <div className="space-y-9">
          {sponsors.map((sponsor, index) => (
            <Card key={index} className="overflow-hidden">
              <div className="md:flex">
                <div className="md:w-1/3 bg-muted flex items-center justify-center p-6">
                  <div className="relative w-32 h-32">
                    <Image
                      src={sponsor.logoPath}
                      alt={`${sponsor.name} logo`}
                      fill
                      style={{ objectFit: 'contain' }}
                      className="rounded-md"
                    />
                  </div>
                </div>
                <CardContent className="p-6 md:w-3/4">
                  <div className="flex justify-between items-start mb-3">
                    <h2 className="text-2xl font-semibold">{sponsor.name}</h2>
                    <a href={sponsor.url} target="_blank" rel="noopener noreferrer" className="hidden md:block">
                      <Button variant="outline" size="sm" className="gap-2">
                        Visit <ExternalLink size={14} />
                      </Button>
                    </a>
                  </div>
                  <p className="text-muted-foreground mb-4">{sponsor.description}</p>
                  <a href={sponsor.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline md:hidden">
                    {sponsor.url} <ExternalLink size={14} className="inline ml-1" />
                  </a>
                </CardContent>
              </div>
            </Card>
          ))}
        </div>
        
        <div className="mt-12 text-center">
          <h2 className="text-2xl font-semibold mb-4">Become a Sponsor</h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Interested in supporting our community? We're always looking for partners who share our values and vision. 
            Reach out to us to learn more about sponsorship opportunities.
          </p>
          <Button size="lg">
            <Link href="/contact">Contact Us</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
