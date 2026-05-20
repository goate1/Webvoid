"use client";

import * as React from 'react';

export default function ContactPage() {
  const [formData, setFormData] = React.useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [status, setStatus] = React.useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus('sending');
  
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
  
      const data = await res.json();
      
      if (res.ok) {
        setStatus('success');
        setFormData({ name: '', email: '', subject: '', message: '' });
      } else {
        console.error('Form submission error:', data.error);
        setStatus('error');
      }
    } catch (err) {
      console.error('Form submission error:', err);
      setStatus('error');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="pt-20 min-h-screen bg-gradient-to-b from-[#1a0a2e] via-[#2a1a3a] to-[#1a0a2e] relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
      </div>
      <div className="void-container py-12 relative z-10">
        {/* Ad Spot - Banner at top */}
        <div className="mb-8">
        </div>

        <div className="max-w-2xl mx-auto">
          <h1 className="text-4xl font-bold mb-6 gradient-text text-center">Contact Us</h1>
          <p className="text-gray-300 text-center mb-8">
            Have questions or want to get in touch? Fill out the form below and we&apos;ll get back to you as soon as possible.
          </p>

          <form onSubmit={handleSubmit} className="void-card space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 bg-[#2A2A2A] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFFFFF] text-white"
                placeholder="Your name"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 bg-[#2A2A2A] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFFFFF] text-white"
                placeholder="your.email@example.com"
              />
            </div>

            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-300 mb-2">
                Subject
              </label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 bg-[#2A2A2A] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFFFFF] text-white"
                placeholder="What is this regarding?"
              />
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-2">
                Message
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                rows={5}
                className="w-full px-4 py-2 bg-[#2A2A2A] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFFFFF] text-white resize-none"
                placeholder="Your message here..."
              />
            </div>

            <button
              type="submit"
              disabled={status === 'sending'}
              className="void-button w-full"
            >
              {status === 'sending' ? 'Sending...' : 'Send Message'}
            </button>

            {status === 'success' && (
              <p className="text-green-500 text-center">
                Thank you for your message! We&apos;ll get back to you soon.
              </p>
            )}
            
            {status === 'error' && (
              <p className="text-red-500 text-center">
                There was an error sending your message. Please try again later.
              </p>
            )}
          </form>

          {/* Ad Spot - Banner at bottom */}
          <div className="mt-12">
          </div>
        </div>
      </div>
    </div>
  );
} 