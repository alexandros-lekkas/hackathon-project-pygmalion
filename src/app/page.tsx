"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gray-900">
            Hackathon Project
          </h1>
          <p className="text-xl text-gray-600">
            A Next.js application with shadcn/ui components
          </p>
          <Badge variant="secondary" className="text-sm">
            Built with Next.js 15 & shadcn/ui
          </Badge>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Welcome Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">🚀</span>
                Welcome
              </CardTitle>
              <CardDescription>
                This is a clean shadcn/ui shell ready for your hackathon project
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                All LiveKit dependencies have been removed. You now have a clean
                foundation to build your hackathon project with shadcn/ui
                components.
              </p>
              <Button className="w-full">Get Started</Button>
            </CardContent>
          </Card>

          {/* Features Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">✨</span>
                Features
              </CardTitle>
              <CardDescription>
                What's included in this shell
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline">Next.js 15</Badge>
                <span className="text-sm">Latest Next.js with App Router</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">shadcn/ui</Badge>
                <span className="text-sm">Beautiful UI components</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">Tailwind CSS</Badge>
                <span className="text-sm">Utility-first styling</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">TypeScript</Badge>
                <span className="text-sm">Type-safe development</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Form Example */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">📝</span>
              Example Form
            </CardTitle>
            <CardDescription>
              A sample form using shadcn/ui components
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" placeholder="Enter your name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="Enter your email" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Input id="message" placeholder="Enter your message" />
            </div>
            <Button className="w-full">Submit</Button>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
          <p>Ready to build something amazing? 🎉</p>
        </div>
      </div>
    </div>
  );
}
