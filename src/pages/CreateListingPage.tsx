import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuctions } from '../context/AuctionContext';
import { useAuth } from '../context/AuthContext';
import { ItemCategory, ItemCondition } from '../types';
import { rupeesToPaise, formatRupees } from '../lib/currency';
import {
  Upload,
  Plus,
  Trash2,
  AlertCircle,
  Clock,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Image as ImageIcon,
} from 'lucide-react';

const CATEGORIES: ItemCategory[] = [
  'Cycles',
  'Calculators',
  'Books',
  'Electronics',
  'Furniture',
  'Hostel Essentials',
  'Accessories',
  'Other',
];

const CONDITIONS: ItemCondition[] = ['Like New', 'Good', 'Fair', 'Needs Repair'];

export const CreateListingPage: React.FC = () => {
  const navigate = useNavigate();
  const { createAuction } = useAuctions();
  const { currentUser } = useAuth();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ItemCategory>('Cycles');
  const [condition, setCondition] = useState<ItemCondition>('Good');
  const [description, setDescription] = useState('');
  const [startingPriceRupees, setStartingPriceRupees] = useState<string>('500');
  const [minIncrementRupees, setMinIncrementRupees] = useState<string>('50');

  // Default closing time: 3 days from now
  const defaultEndsAt = new Date(Date.now() + 3 * 86400 * 1000)
    .toISOString()
    .slice(0, 16);
  const [endsAt, setEndsAt] = useState<string>(defaultEndsAt);

  const [images, setImages] = useState<string[]>([
    'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=800&q=80',
  ]);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAddImage = () => {
    if (newImageUrl.trim()) {
      setImages([...images, newImageUrl.trim()]);
      setNewImageUrl('');
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Convert local files to object URLs for immediate preview
    const newUrls: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 5 * 1024 * 1024) {
        setError('Image file size must be less than 5MB');
        return;
      }
      newUrls.push(URL.createObjectURL(file));
    }
    setImages([...images, ...newUrls]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!currentUser) {
      setError('Please sign in with your verified campus email to list an item.');
      return;
    }

    if (title.trim().length < 5) {
      setError('Title must be at least 5 characters long.');
      return;
    }

    if (description.trim().length < 15) {
      setError('Description must be at least 15 characters (include hostel block, condition, reasons).');
      return;
    }

    const startPaise = rupeesToPaise(Number(startingPriceRupees));
    if (isNaN(startPaise) || startPaise <= 0) {
      setError('Starting price must be a positive amount.');
      return;
    }

    const incPaise = rupeesToPaise(Number(minIncrementRupees));
    if (isNaN(incPaise) || incPaise <= 0) {
      setError('Minimum bid increment must be a positive amount (e.g. ₹50 or ₹100).');
      return;
    }

    const closingTimeMs = new Date(endsAt).getTime();
    if (isNaN(closingTimeMs) || closingTimeMs <= Date.now()) {
      setError('Closing date and time must be in the future.');
      return;
    }

    if (images.length === 0) {
      setError('Please provide at least one photo of the item.');
      return;
    }

    setLoading(true);
    try {
      const res = await createAuction({
        title: title.trim(),
        description: description.trim(),
        category,
        condition,
        starting_price_paise: startPaise,
        minimum_increment_paise: incPaise,
        ends_at: new Date(endsAt).toISOString(),
        images,
      });

      if (!res.success) {
        setError(res.error || 'Failed to create listing');
      } else {
        navigate(`/auctions/${res.auctionId}`);
      }
    } catch (err: any) {
      setError(err.message || 'Error creating auction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          List an Item for Campus Auction
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Give your gear a second life with transparent student bidding and fair hostel handover.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Details */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
          <h2 className="text-base font-bold text-slate-900">1. Item Information</h2>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Listing Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="E.g. Hero Sprint Pro 21-Speed Mountain Cycle (with lock & lights)"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm font-medium"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ItemCategory)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm bg-white font-medium"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Item Condition *</label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value as ItemCondition)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm bg-white font-medium"
              >
                {CONDITIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Description & Specifications *
            </label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe condition, when it was purchased, accessories included, and preferred campus pickup location..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
            />
          </div>
        </div>

        {/* Photos */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
          <h2 className="text-base font-bold text-slate-900">2. Item Photos</h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {images.map((img, i) => (
              <div key={i} className="relative aspect-square rounded-2xl overflow-hidden border border-slate-200 group">
                <img src={img} alt={`Upload ${i + 1}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(i)}
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-white hover:bg-red-600 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}

            <label className="aspect-square rounded-2xl border-2 border-dashed border-slate-300 hover:border-brand-500 hover:bg-brand-50/50 flex flex-col items-center justify-center cursor-pointer transition-all p-3 text-center">
              <Upload className="w-6 h-6 text-slate-400 mb-1" />
              <span className="text-xs font-bold text-slate-700">Upload Image</span>
              <span className="text-[10px] text-slate-400">PNG, JPG up to 5MB</span>
              <input type="file" accept="image/*" multiple onChange={handleFileUpload} className="hidden" />
            </label>
          </div>

          {/* Add URL alternative */}
          <div className="flex items-center gap-2 pt-2">
            <input
              type="url"
              value={newImageUrl}
              onChange={(e) => setNewImageUrl(e.target.value)}
              placeholder="Or paste an image web URL..."
              className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <button
              type="button"
              onClick={handleAddImage}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          </div>
        </div>

        {/* Pricing & Duration */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
          <h2 className="text-base font-bold text-slate-900">3. Auction Rules & Timing</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Starting Bid (₹) *
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 font-bold text-sm">
                  ₹
                </span>
                <input
                  type="number"
                  min="1"
                  required
                  value={startingPriceRupees}
                  onChange={(e) => setStartingPriceRupees(e.target.value)}
                  className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                />
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">Rule 1: First bid must meet this price</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Minimum Bid Increment (₹) *
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 font-bold text-sm">
                  ₹
                </span>
                <input
                  type="number"
                  min="10"
                  step="10"
                  required
                  value={minIncrementRupees}
                  onChange={(e) => setMinIncrementRupees(e.target.value)}
                  className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                />
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">Rule 2: Each subsequent bid must advance by this</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Auction Closing Date & Time *
            </label>
            <input
              type="datetime-local"
              required
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm font-medium"
            />
            <span className="text-[11px] text-amber-700 font-medium mt-1 flex items-center gap-1">
              <Clock className="w-3 h-3 text-amber-600" />
              Rule 7: Any bid in final 30 seconds automatically adds a 60-second anti-sniping extension.
            </span>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-2 text-xs text-red-700 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Submit Button */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={() => navigate('/marketplace')}
            className="px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-7 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-bold text-sm shadow-md transition-all flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            {loading ? 'Publishing Auction...' : 'Publish Campus Auction'}
          </button>
        </div>
      </form>
    </div>
  );
};
