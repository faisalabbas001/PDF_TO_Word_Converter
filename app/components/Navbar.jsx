'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';

const Navbar = () => {
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef(null);
  const toolsButtonRef = useRef(null);
  const [isMounted, setIsMounted] = useState(false);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target) &&
          !toolsButtonRef.current?.contains(event.target)) {
        setIsMobileMenuOpen(false);
        setIsToolsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close menus when screen size changes
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 1024) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  const tools = {
    'Compress': {
      items: [
        { name: 'Compress PDF', path: '/compress-pdf', icon: '/icons/compress.svg', bgColor: 'bg-red-100' }
      ]
    },
    'Convert': {
      items: [
        { name: 'PDF Converter', path: '/pdf-converter', icon: '/icons/convert.svg', bgColor: 'bg-red-100' }
      ]
    },
    'Organize': {
      items: [
        { name: 'Merge PDF', path: '/merge-pdf', icon: '/icons/merge.svg', bgColor: 'bg-purple-100' },
        { name: 'Split PDF', path: '/split-pdf', icon: '/icons/split.svg', bgColor: 'bg-purple-100' },
        { name: 'Rotate PDF', path: '/rotate-pdf', icon: '/icons/rotate.svg', bgColor: 'bg-purple-100' },
        { name: 'Delete PDF Pages', path: '/delete-pages', icon: '/icons/delete.svg', bgColor: 'bg-purple-100' },
        { name: 'Extract PDF Pages', path: '/extract-pages', icon: '/icons/extract.svg', bgColor: 'bg-purple-100' },
        { name: 'Organize PDF', path: '/organize-pdf', icon: '/icons/organize.svg', bgColor: 'bg-purple-100' }
      ]
    },
    'View & Edit': {
      items: [
        { name: 'Edit PDF', path: '/edit-pdf', icon: '/icons/edit.svg', bgColor: 'bg-cyan-100' },
        { name: 'PDF Annotator', path: '/annotate-pdf', icon: '/icons/annotate.svg', bgColor: 'bg-cyan-100' },
        { name: 'PDF Reader', path: '/pdf-reader', icon: '/icons/reader.svg', bgColor: 'bg-cyan-100' },
        { name: 'Number Pages', path: '/number-pages', icon: '/icons/number.svg', bgColor: 'bg-cyan-100' },
        { name: 'Crop PDF', path: '/crop-pdf', icon: '/icons/crop.svg', bgColor: 'bg-cyan-100' },
        { name: 'Watermark PDF', path: '/watermark-pdf', icon: '/icons/watermark.svg', bgColor: 'bg-cyan-100' },
        { name: 'Share PDF', path: '/share-pdf', icon: '/icons/share.svg', bgColor: 'bg-cyan-100' }
      ]
    },
    'Convert from PDF': {
      items: [
        { name: 'PDF to Word', path: '/pdf-to-word', icon: '/icons/word.svg', bgColor: 'bg-blue-100' },
        { name: 'PDF to Excel', path: '/pdf-to-excel', icon: '/icons/excel.svg', bgColor: 'bg-green-100' },
        { name: 'PDF to PPT', path: '/pdf-to-ppt', icon: '/icons/powerpoint.svg', bgColor: 'bg-orange-100' },
        { name: 'PDF to JPG', path: '/pdf-to-jpg', icon: '/icons/jpg.svg', bgColor: 'bg-yellow-100' }
      ]
    },
    'Convert to PDF': {
      items: [
        { name: 'Word to PDF', path: '/word-to-pdf', icon: '/icons/word.svg', bgColor: 'bg-blue-100' },
        { name: 'Excel to PDF', path: '/excel-to-pdf', icon: '/icons/excel.svg', bgColor: 'bg-green-100' },
        { name: 'PPT to PDF', path: '/ppt-to-pdf', icon: '/icons/powerpoint.svg', bgColor: 'bg-orange-100' },
        { name: 'JPG to PDF', path: '/jpg-to-pdf', icon: '/icons/jpg.svg', bgColor: 'bg-yellow-100' },
        { name: 'PDF OCR', path: '/pdf-ocr', icon: '/icons/ocr.svg', bgColor: 'bg-red-100' }
      ]
    },
    'Sign': {
      items: [
        { name: 'Sign PDF', path: '/sign-pdf', icon: '/icons/sign.svg', bgColor: 'bg-pink-100' },
        { name: 'Request Signatures', path: '/request-signatures', icon: '/icons/request-sign.svg', bgColor: 'bg-pink-100' }
      ]
    },
    'More': {
      items: [
        { name: 'Unlock PDF', path: '/unlock-pdf', icon: '/icons/unlock.svg', bgColor: 'bg-pink-100' },
        { name: 'Protect PDF', path: '/protect-pdf', icon: '/icons/protect.svg', bgColor: 'bg-pink-100' },
        { name: 'Flatten PDF', path: '/flatten-pdf', icon: '/icons/flatten.svg', bgColor: 'bg-pink-100' }
      ]
    },
    'Scan': {
      items: [
        { name: 'PDF Scanner', path: '/pdf-scanner', icon: '/icons/scanner.svg', bgColor: 'bg-blue-100' }
      ]
    }
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 relative z-50">
      <div className="max-w-[1920px] mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center">
              <Image src="/logo.svg" alt="Logo" width={130} height={32} priority />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1">
            {/* Tools Button */}
            <div className="relative" ref={toolsButtonRef}>
              <button
                onClick={() => setIsToolsOpen(!isToolsOpen)}
                className="flex items-center px-3 py-2 text-sm hover:bg-gray-100 rounded-md"
              >
                <svg className="w-5 h-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2 4h16v2H2V4zm0 5h16v2H2V9zm0 5h16v2H2v-2z" />
                </svg>
                Tools
                <svg className={`ml-1 w-4 h-4 transition-transform ${isToolsOpen ? 'rotate-180' : ''}`} 
                     fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Tools Dropdown Menu */}
              {isToolsOpen && (
                <div 
                  className="fixed left-0 right-0 mx-auto top-16 w-[90%] max-w-7xl bg-white rounded-lg shadow-xl border border-gray-200 z-50"
                  style={{
                    position: 'fixed',
                    left: '50%',
                    transform: 'translateX(-50%)',
                  }}
                >
                  <div className="grid grid-cols-7 p-4 gap-4">
                    {/* Compress Section */}
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 mb-2">Compress</h3>
                      <Link href="/compress-pdf" className="flex items-center space-x-2 p-1.5 rounded hover:bg-gray-50">
                        <div className="bg-red-50 p-2 rounded">
                          <Image src="/icons/compress.svg" alt="" width={20} height={20} />
                        </div>
                        <span className="text-sm">Compress PDF</span>
                      </Link>
                    </div>

                    {/* Convert Section */}
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 mb-2">Convert</h3>
                      <Link href="/pdf-converter" className="flex items-center space-x-2 p-1.5 rounded hover:bg-gray-50">
                        <div className="bg-red-50 p-2 rounded">
                          <Image src="/icons/convert.svg" alt="" width={20} height={20} />
                        </div>
                        <span className="text-sm">PDF Converter</span>
                      </Link>
                    </div>

                    {/* Organize Section */}
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 mb-2">Organize</h3>
                      <div className="space-y-1">
                        {[
                          { name: 'Merge PDF', icon: 'merge.svg', bg: 'bg-purple-50' },
                          { name: 'Split PDF', icon: 'split.svg', bg: 'bg-purple-50' },
                          { name: 'Rotate PDF', icon: 'rotate.svg', bg: 'bg-purple-50' },
                          { name: 'Delete PDF Pages', icon: 'delete.svg', bg: 'bg-purple-50' },
                          { name: 'Extract PDF Pages', icon: 'extract.svg', bg: 'bg-purple-50' },
                          { name: 'Organize PDF', icon: 'organize.svg', bg: 'bg-purple-50' }
                        ].map((item) => (
                          <Link
                            key={item.name}
                            href={`/${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                            className="flex items-center space-x-2 p-1.5 rounded hover:bg-gray-50"
                          >
                            <div className={`${item.bg} p-2 rounded`}>
                              <Image src={`/icons/${item.icon}`} alt="" width={20} height={20} />
                            </div>
                            <span className="text-sm">{item.name}</span>
                          </Link>
                        ))}
                      </div>
                    </div>

                    {/* View & Edit Section */}
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 mb-2">View & Edit</h3>
                      <div className="space-y-1">
                        {[
                          { name: 'Edit PDF', icon: 'edit.svg', bg: 'bg-cyan-50' },
                          { name: 'PDF Annotator', icon: 'annotator.svg', bg: 'bg-cyan-50' },
                          { name: 'PDF Reader', icon: 'reader.svg', bg: 'bg-cyan-50' },
                          { name: 'Number Pages', icon: 'number.svg', bg: 'bg-cyan-50' },
                          { name: 'Crop PDF', icon: 'crop.svg', bg: 'bg-cyan-50' },
                          { name: 'Watermark PDF', icon: 'watermark.svg', bg: 'bg-cyan-50' },
                          { name: 'Share PDF', icon: 'share.svg', bg: 'bg-cyan-50' }
                        ].map((item) => (
                          <Link
                            key={item.name}
                            href={`/${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                            className="flex items-center space-x-2 p-1.5 rounded hover:bg-gray-50"
                          >
                            <div className={`${item.bg} p-2 rounded`}>
                              <Image src={`/icons/${item.icon}`} alt="" width={20} height={20} />
                            </div>
                            <span className="text-sm">{item.name}</span>
                          </Link>
                        ))}
                      </div>
                    </div>

                    {/* Convert from PDF Section */}
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 mb-2">Convert from PDF</h3>
                      <div className="space-y-1">
                        {[
                          { name: 'PDF to Word', icon: 'word.svg', bg: 'bg-blue-50' },
                          { name: 'PDF to Excel', icon: 'excel.svg', bg: 'bg-green-50' },
                          { name: 'PDF to PPT', icon: 'ppt.svg', bg: 'bg-orange-50' },
                          { name: 'PDF to JPG', icon: 'jpg.svg', bg: 'bg-yellow-50' }
                        ].map((item) => (
                          <Link
                            key={item.name}
                            href={`/${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                            className="flex items-center space-x-2 p-1.5 rounded hover:bg-gray-50"
                          >
                            <div className={`${item.bg} p-2 rounded`}>
                              <Image src={`/icons/${item.icon}`} alt="" width={20} height={20} />
                            </div>
                            <span className="text-sm">{item.name}</span>
                          </Link>
                        ))}
                      </div>
                    </div>

                    {/* Convert to PDF Section */}
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 mb-2">Convert to PDF</h3>
                      <div className="space-y-1">
                        {[
                          { name: 'Word to PDF', icon: 'word.svg', bg: 'bg-blue-50' },
                          { name: 'Excel to PDF', icon: 'excel.svg', bg: 'bg-green-50' },
                          { name: 'PPT to PDF', icon: 'ppt.svg', bg: 'bg-orange-50' },
                          { name: 'JPG to PDF', icon: 'jpg.svg', bg: 'bg-yellow-50' },
                          { name: 'PDF OCR', icon: 'ocr.svg', bg: 'bg-red-50' }
                        ].map((item) => (
                          <Link
                            key={item.name}
                            href={`/${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                            className="flex items-center space-x-2 p-1.5 rounded hover:bg-gray-50"
                          >
                            <div className={`${item.bg} p-2 rounded`}>
                              <Image src={`/icons/${item.icon}`} alt="" width={20} height={20} />
                            </div>
                            <span className="text-sm">{item.name}</span>
                          </Link>
                        ))}
                      </div>
                    </div>

                    {/* Sign & More Section */}
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 mb-2">Sign</h3>
                      <div className="space-y-1">
                        {[
                          { name: 'Sign PDF', icon: 'sign.svg', bg: 'bg-pink-50' },
                          { name: 'Request Signatures', icon: 'request-sign.svg', bg: 'bg-pink-50' }
                        ].map((item) => (
                          <Link
                            key={item.name}
                            href={`/${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                            className="flex items-center space-x-2 p-1.5 rounded hover:bg-gray-50"
                          >
                            <div className={`${item.bg} p-2 rounded`}>
                              <Image src={`/icons/${item.icon}`} alt="" width={20} height={20} />
                            </div>
                            <span className="text-sm">{item.name}</span>
                          </Link>
                        ))}

                        <h3 className="text-sm font-medium text-gray-900 mt-4 mb-2">More</h3>
                        {[
                          { name: 'Unlock PDF', icon: 'unlock.svg', bg: 'bg-pink-50' },
                          { name: 'Protect PDF', icon: 'protect.svg', bg: 'bg-pink-50' },
                          { name: 'Flatten PDF', icon: 'flatten.svg', bg: 'bg-pink-50' }
                        ].map((item) => (
                          <Link
                            key={item.name}
                            href={`/${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                            className="flex items-center space-x-2 p-1.5 rounded hover:bg-gray-50"
                          >
                            <div className={`${item.bg} p-2 rounded`}>
                              <Image src={`/icons/${item.icon}`} alt="" width={20} height={20} />
                            </div>
                            <span className="text-sm">{item.name}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Access Tools */}
            <Link href="/compress" className="px-3 py-2 text-sm hover:bg-gray-100 rounded-md">Compress</Link>
            <Link href="/convert" className="px-3 py-2 text-sm hover:bg-gray-100 rounded-md">Convert</Link>
            <Link href="/merge" className="px-3 py-2 text-sm hover:bg-gray-100 rounded-md">Merge</Link>
            <Link href="/edit" className="px-3 py-2 text-sm hover:bg-gray-100 rounded-md">Edit</Link>
            <Link href="/sign" className="px-3 py-2 text-sm hover:bg-gray-100 rounded-md">Sign</Link>
            <Link href="/ai-pdf" className="px-3 py-2 text-sm hover:bg-gray-100 rounded-md">AI PDF</Link>
          </div>

          {/* Right Side Navigation */}
          <div className="flex items-center space-x-4">
            <Link href="/pricing" className="hidden lg:block text-sm hover:text-blue-600">Pricing</Link>
            <Link href="/teams" className="hidden lg:block text-sm hover:text-blue-600">Teams</Link>
            <Link href="/login" className="hidden lg:block text-sm hover:text-blue-600">Log In</Link>
            <Link 
              href="/free-trial" 
              className="bg-blue-600 text-white px-4 py-2 text-sm rounded-lg hover:bg-blue-700 transition-colors"
            >
              Free Trial
            </Link>

            {/* Hamburger Menu Button */}
            <button
              className="lg:hidden p-2 rounded-md hover:bg-gray-100"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle menu"
            >
              <svg 
                className="w-6 h-6" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d={isMobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div 
            ref={mobileMenuRef}
            className="lg:hidden fixed inset-0 top-16 bg-white z-50 overflow-y-auto"
          >
            <div className="px-4 py-2 space-y-1">
              {/* Mobile Quick Access */}
              <div className="py-2 border-b border-gray-200">
                <Link href="/compress" className="block px-3 py-2 text-base hover:bg-gray-100 rounded-md">Compress</Link>
                <Link href="/convert" className="block px-3 py-2 text-base hover:bg-gray-100 rounded-md">Convert</Link>
                <Link href="/merge" className="block px-3 py-2 text-base hover:bg-gray-100 rounded-md">Merge</Link>
                <Link href="/edit" className="block px-3 py-2 text-base hover:bg-gray-100 rounded-md">Edit</Link>
                <Link href="/sign" className="block px-3 py-2 text-base hover:bg-gray-100 rounded-md">Sign</Link>
                <Link href="/ai-pdf" className="block px-3 py-2 text-base hover:bg-gray-100 rounded-md">AI PDF</Link>
              </div>

              {/* Mobile Tools Menu */}
              <div className="py-2 space-y-2">
                {Object.entries(tools).map(([category, { items }]) => (
                  <div key={category} className="space-y-1">
                    <h3 className="px-3 text-sm font-medium text-gray-900">{category}</h3>
                    {items.map((item) => (
                      <Link
                        key={item.name}
                        href={item.path}
                        className="flex items-center px-3 py-2 text-base hover:bg-gray-100 rounded-md"
                      >
                        <div className={`p-2 rounded-lg ${item.bgColor} mr-3`}>
                          <Image src={item.icon} alt="" width={20} height={20} />
                        </div>
                        <span>{item.name}</span>
                      </Link>
                    ))}
                  </div>
                ))}
              </div>

              {/* Mobile Navigation Links */}
              <div className="py-2 border-t border-gray-200">
                <Link href="/pricing" className="block px-3 py-2 text-base hover:bg-gray-100 rounded-md">Pricing</Link>
                <Link href="/teams" className="block px-3 py-2 text-base hover:bg-gray-100 rounded-md">Teams</Link>
                <Link href="/login" className="block px-3 py-2 text-base hover:bg-gray-100 rounded-md">Log In</Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;