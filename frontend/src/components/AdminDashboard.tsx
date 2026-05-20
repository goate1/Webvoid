"use client";



import { useState, useEffect, useRef } from 'react';

import { useRouter } from 'next/navigation';

import { useOrders, Order } from '@/contexts/OrderContext';

import { reviewService, Review } from '@/lib/reviewService';

import { formatOrderNumber } from '@/lib/orderUtils';

import { productService, type Product, type CustomField, type Size } from '@/lib/productService';

import { newsService, type NewsArticle } from '@/lib/newsService';

import { placementService, type Placement } from '@/lib/placementService';

import { scheduleService, type Match } from '@/lib/scheduleService';

import { teamService, Team, Player } from '@/lib/teamService';

import { ambassadorService, Ambassador } from '@/lib/ambassadorService';

import { AnimatedCard } from '@/components/FramerAnimations';

import { processExternalImageUrl } from '@/lib/imageUtils';

import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';

import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';

import { auth, db } from '@/lib/firebase';
import LoadingScreen from './LoadingScreen';
import { logService, Log } from '@/lib/logService';
import ProductsTab from './admin/ProductsTab';
import TeamsTab from './admin/TeamsTab';
import AmbassadorsTab from './admin/AmbassadorsTab';
import NewsTab from './admin/NewsTab';
import PlacementsTab from './admin/PlacementsTab';
import ScheduleTab from './admin/ScheduleTab';
import SocialsTab from './admin/SocialsTab';
import UsersTab from './admin/UsersTab';
import SupportTab from './admin/SupportTab';

import { Timestamp } from 'firebase/firestore';



import {

  TrashIcon,

  UserIcon,

  StarIcon,

  ShoppingBagIcon,

  ChartBarIcon,

  CurrencyDollarIcon,

  EyeIcon,

  PencilIcon,

  CheckIcon,

  XMarkIcon,

  DocumentIcon,

  FolderIcon,

  LightBulbIcon,

  MagnifyingGlassIcon,

  CloudArrowUpIcon,

  UserGroupIcon,

  NewspaperIcon,

  TrophyIcon,

  CalendarIcon,

  LinkIcon,

  UserPlusIcon,

  ChevronDownIcon,

  ChevronRightIcon,

  ChevronUpIcon,

  ChartPieIcon,

  EnvelopeIcon,

  KeyIcon,

  ChatBubbleLeftRightIcon,

  ExclamationTriangleIcon,

} from '@heroicons/react/24/outline';

import Image from 'next/image';



const statusColors = {

  pending: 'bg-yellow-900/20 text-yellow-400 border-yellow-500/20',

  accepted: 'bg-blue-900/20 text-blue-400 border-blue-500/20',

  processing: 'bg-purple-900/20 text-purple-400 border-purple-500/20',

  delivered: 'bg-green-900/20 text-green-400 border-green-500/20',

  declined: 'bg-red-900/20 text-red-400 border-red-500/20',

  canceled: 'bg-gray-900/20 text-gray-400 border-gray-500/20',

};



export default function AdminDashboard() {

  const router = useRouter();

  const { orders, updateOrderStatus, deleteOrder } = useOrders();

  const [reviews, setReviews] = useState<Review[]>([]);

  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<'products' | 'teams' | 'ambassadors' | 'news' | 'placements' | 'schedule' | 'socials' | 'users' | 'reviews' | 'logs' | 'support'>('products');

  





  // User management state

  const [adminUsers, setAdminUsers] = useState<any[]>([]);

  const [showCreateUser, setShowCreateUser] = useState(false);

  const [newUserEmail, setNewUserEmail] = useState('');

  const [newUserPassword, setNewUserPassword] = useState('');

  const [currentUser, setCurrentUser] = useState<any>(null);

  const [creatingUser, setCreatingUser] = useState(false);



  // Team management state

  const [teams, setTeams] = useState<Team[]>([]);

  const [loadingTeams, setLoadingTeams] = useState(false);

  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

  const [showAddPlayer, setShowAddPlayer] = useState(false);

  const [editingPlayer, setEditingPlayer] = useState<{ teamId: string; playerIndex: number; player: Player } | null>(null);

  const [newPlayer, setNewPlayer] = useState<Omit<Player, 'id'>>({

    name: '',

    role: '',

    image: '',

    game: '',

    achievements: [],

    socialLinks: {}

  });

  const [showCreateTeam, setShowCreateTeam] = useState(false);

  const [showEditTeam, setShowEditTeam] = useState(false);

  const [editingTeam, setEditingTeam] = useState<Team | null>(null);

  const [newTeam, setNewTeam] = useState<Omit<Team, 'id' | 'createdAt'>>({

    name: '',

    image: '',

    description: '',

    achievements: [],

    players: []

  });



  // Ambassador management state

  const [ambassadors, setAmbassadors] = useState<Ambassador[]>([]);

  const [loadingAmbassadors, setLoadingAmbassadors] = useState(false);

  const [showCreateAmbassador, setShowCreateAmbassador] = useState(false);

  const [editingAmbassador, setEditingAmbassador] = useState<Ambassador | null>(null);

  const [ambassadorForm, setAmbassadorForm] = useState<Omit<Ambassador, 'id' | 'createdAt'>>({

    name: '',

    role: 'Ambassador',

    image: '',

    game: '',

    achievements: [],

    socialLinks: {}

  });

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const [showOrderDetails, setShowOrderDetails] = useState(false);

  const [filterStatus, setFilterStatus] = useState<Order['status'] | 'all'>('all');

  const [selectedReviews, setSelectedReviews] = useState<Set<string>>(new Set());

  const [showBulkActions, setShowBulkActions] = useState(false);

  const [products, setProducts] = useState<Product[]>([]);

  const [loadingProducts, setLoadingProducts] = useState(false);



  // Product customization state

  const [selectedProductForCustomization, setSelectedProductForCustomization] = useState<Product | null>(null);

  const [customizationForm, setCustomizationForm] = useState<{
    hasCustomFields: boolean;
    hasSizes: boolean;
    hasSizeChart: boolean;
    customFields: CustomField[];
    sizes: Size[];
  }>({
    hasCustomFields: false,
    hasSizes: false,
    hasSizeChart: false,
    customFields: [],
    sizes: []
  });

  const [logs, setLogs] = useState<Log[]>([]);

  const [loadingLogs, setLoadingLogs] = useState(false);





  // Products modal state

  const [showProductModal, setShowProductModal] = useState(false);

  const [productMode, setProductMode] = useState<'create' | 'edit'>('create');

  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  const [productForm, setProductForm] = useState<Omit<Product, 'id' | 'createdAt'>>({

    name: '', price: 0, image: '', images: [], hoverImage: '', category: '', description: '', link: '', displayOnHomePage: false

  });



  // News modal state

  const [showNewsModal, setShowNewsModal] = useState(false);

  const [newsMode, setNewsMode] = useState<'create' | 'edit'>('create');

  const [editingNewsId, setEditingNewsId] = useState<string | null>(null);

  const [newsForm, setNewsForm] = useState<Omit<NewsArticle, 'id' | 'date'>>({

    title: '', image: '', description: '', category: ''

  });

  const [newsDate, setNewsDate] = useState<string>('');



  // Placement modal state

  const [showPlacementModal, setShowPlacementModal] = useState(false);

  const [placementMode, setPlacementMode] = useState<'create' | 'edit'>('create');

  const [editingPlacementId, setEditingPlacementId] = useState<string | null>(null);

  const [placementForm, setPlacementForm] = useState<Omit<Placement, 'id' | 'createdAt'>>({

    game: '', tournament: '', team: '', position: '', players: [], prize: '', logo: ''

  });

  const [placementPlayersText, setPlacementPlayersText] = useState<string>('');



  // Schedule (Match) modal state

  const [showMatchModal, setShowMatchModal] = useState(false);

  const [matchMode, setMatchMode] = useState<'create' | 'edit'>('create');

  const [editingMatchId, setEditingMatchId] = useState<string | null>(null);

  const [matchForm, setMatchForm] = useState<Omit<Match, 'id' | 'createdAt'>>({

    game: '', event: '', opponent: '', date: '', time: '', streamLink: ''

  });



  useEffect(() => {

    if (selectedProductForCustomization) {
      setCustomizationForm({
        hasCustomFields: selectedProductForCustomization.hasCustomFields || false,
        hasSizes: selectedProductForCustomization.hasSizes || false,
        hasSizeChart: selectedProductForCustomization.hasSizeChart || false,
        customFields: selectedProductForCustomization.customFields || [],
        sizes: selectedProductForCustomization.sizes || []
      });
    }

  }, [selectedProductForCustomization]);



  useEffect(() => {

    const loadData = async () => {

      try {

        const results = await Promise.allSettled([

          reviewService.getAllReviews(),

          teamService.getAll(),

          ambassadorService.getAll(),

          productService.getAll(),

          logService.getAll()

        ]);



        setReviews(results[0].status === 'fulfilled' ? results[0].value : []);

        setTeams(results[1].status === 'fulfilled' ? results[1].value : []);

        setAmbassadors(results[2].status === 'fulfilled' ? results[2].value : []);

        setProducts(results[3].status === 'fulfilled' ? results[3].value : []);

        setLogs(results[4].status === 'fulfilled' ? results[4].value : []);

      } catch (error) {

        console.error('Error loading data:', error);

      } finally {

        setLoading(false);

      }

    };



    loadData();



  }, []);



  useEffect(() => {

    if (auth) {

      const unsubscribe = onAuthStateChanged(auth, (user) => {

        setCurrentUser(user);

      });

      return unsubscribe;

    }

  }, []);



  // Real-time support tickets listener




  const logAction = async (

    action: Log['action'],

    entity: Log['entity'],

    entityId: string,

    details: string,

    options?: {

      beforeSnapshot?: Record<string, any>;

      afterSnapshot?: Record<string, any>;

      level?: Log['level'];

      status?: Log['status'];

      duration?: number;

      errorMessage?: string;

      bulkOperation?: { count: number; items: string[]; summary: string };

      metadata?: Record<string, any>;

    }

  ): Promise<string> => {

    if (!currentUser?.email) return '';



    const startTime = performance.now();



    try {

      const { ipAddress, userAgent } = logService.getClientInfo();



      // Generate IDs if not provided

      const sessionId = options?.metadata?.sessionId || logService.generateSessionId();

      const requestId = options?.metadata?.requestId || logService.generateRequestId();



      // Determine log level and status based on action and options

      const level = options?.level || (

        action === 'error' ? 'error' :

        action === 'delete' ? 'warn' :

        'info'

      );



      const status = options?.status || (

        options?.errorMessage ? 'error' : 'success'

      );



      // Calculate changes if snapshots are provided

      let changes: Log['changes'];

      if (options?.beforeSnapshot && options?.afterSnapshot) {

        changes = logService.calculateChanges(options.beforeSnapshot, options.afterSnapshot);

      }



      const logData: Omit<Log, 'id' | 'timestamp'> = {

        action,

        entity,

        entityId,

        details,

        adminEmail: currentUser.email,

        level,

        status,

        ipAddress,

        userAgent,

        sessionId,

        requestId,

        duration: options?.duration || (performance.now() - startTime),

        errorMessage: options?.errorMessage,

        beforeSnapshot: options?.beforeSnapshot,

        afterSnapshot: options?.afterSnapshot,

        changes,

        bulkOperation: options?.bulkOperation,

        metadata: {

          ...options?.metadata,

          sessionId,

          requestId,

          userAgent,

          timestamp: new Date().toISOString()

        }

      };



      // Filter out undefined fields before saving to Firebase

      const filteredLogData = Object.fromEntries(

        Object.entries(logData).filter(([_, value]) => value !== undefined)

      );



      const logId = await logService.create(filteredLogData as Omit<Log, 'id' | 'timestamp'>);



      // Add the new log to state immediately

      const newLog: Log = {

        id: logId,

        ...logData,

        timestamp: Timestamp.now()

      };

      setLogs(prev => [newLog, ...prev]);



      return logId;

    } catch (error) {

      console.error('Failed to log action:', error);

      // Try to log the error itself

      try {

        const errorLogData = {

          action: 'error',

          entity: 'system',

          entityId: 'logging_error',

          details: `Failed to log action: ${action} on ${entity}`,

          adminEmail: currentUser.email,

          level: 'error',

          status: 'error',

          errorMessage: error instanceof Error ? error.message : 'Unknown logging error',

          duration: performance.now() - startTime,

          metadata: { originalAction: action, originalEntity: entity }

        };



        // Filter out undefined fields before saving

        const filteredErrorLogData = Object.fromEntries(

          Object.entries(errorLogData).filter(([_, value]) => value !== undefined)

        );



        await logService.create(filteredErrorLogData as Omit<Log, 'id' | 'timestamp'>);

      } catch (logError) {

        console.error('Failed to log logging error:', logError);

      }

      return '';

    }

  };



  const handleCreateUser = async () => {

    if (!auth || !currentUser) {

      alert('You must be logged in to create users');

      return;

    }



    if (!newUserEmail || !newUserPassword) {

      alert('Please enter both email and password');

      return;

    }



    if (newUserPassword.length < 6) {

      alert('Password must be at least 6 characters');

      return;

    }



    setCreatingUser(true);

    const originalEmail = currentUser.email;



    try {

      // Create the new user (this will automatically sign them in)

      const userCredential = await createUserWithEmailAndPassword(auth, newUserEmail, newUserPassword);

      console.log('User created:', userCredential.user.email);



      // Immediately sign out the newly created user

      await signOut(auth);



      alert(`User ${newUserEmail} created successfully! They can now log in with their credentials. You will need to log back in.`);

      setNewUserEmail('');

      setNewUserPassword('');

      setShowCreateUser(false);



      // Redirect to login page

      window.location.href = '/adminpanel';

      await logAction('create', 'user', userCredential.user.uid, `Created admin user "${newUserEmail}"`, {

        level: 'info',

        status: 'success',

        metadata: { createdBy: currentUser.email, userRole: 'admin' }

      });

    } catch (error: any) {

      console.error('Error creating user:', error);

      let errorMessage = 'Failed to create user';



      if (error.code === 'auth/email-already-in-use') {

        errorMessage = 'This email is already registered';

      } else if (error.code === 'auth/invalid-email') {

        errorMessage = 'Invalid email format';

      } else if (error.code === 'auth/weak-password') {

        errorMessage = 'Password is too weak';

      } else if (error.message) {

        errorMessage = error.message;

      }



      alert(errorMessage);

    } finally {

      setCreatingUser(false);

    }

  };



  // Reload products when they're updated

  const reloadProducts = async () => {

    try {

      setLoadingProducts(true);

      const productsData = await productService.getAll();

      setProducts(productsData);

    } catch (error) {

      console.error('Error loading products:', error);

    } finally {

      setLoadingProducts(false);

    }

  };



  const openCreateProduct = () => {

    setProductMode('create');

    setEditingProductId(null);

    setProductForm({ name: '', price: 0, image: '', images: [], hoverImage: '', category: '', description: '', link: '', displayOnHomePage: false });

    setShowProductModal(true);

  };



  const openEditProduct = (product: Product) => {

    setProductMode('edit');

    setEditingProductId(product.id!);

    setProductForm({

      name: product.name,

      price: product.price,

      image: product.image,

      images: product.images || [],

      hoverImage: product.hoverImage || '',

      category: product.category,

      description: product.description,

      link: product.link,

      displayOnHomePage: product.displayOnHomePage || false

    });

    setShowProductModal(true);

  };



  const addImageField = () => {

    setProductForm(prev => ({

      ...prev,

      images: [...(prev.images || []), '']

    }));

  };



  const removeImageField = (index: number) => {

    setProductForm(prev => ({

      ...prev,

      images: (prev.images || []).filter((_, i) => i !== index)

    }));

  };



  const updateImageField = (index: number, value: string) => {

    setProductForm(prev => ({

      ...prev,

      images: (prev.images || []).map((img, i) => i === index ? value : img)

    }));

  };



  const openCreateNews = () => {

    setNewsMode('create');

    setEditingNewsId(null);

    setNewsForm({ title: '', image: '', description: '', category: '' });

    setNewsDate('');

    setShowNewsModal(true);

  };

  const openEditNews = (n: NewsArticle) => {

    setNewsMode('edit');

    setEditingNewsId(n.id!);

    setNewsForm({ title: n.title, image: n.image, description: n.description, category: n.category });

    setNewsDate(new Date(n.date.toDate()).toISOString().slice(0, 16));

    setShowNewsModal(true);

  };



  const openCreatePlacement = () => {

    setPlacementMode('create');

    setEditingPlacementId(null);

    setPlacementForm({ game: '', tournament: '', team: '', position: '', players: [], prize: '', logo: '' });

    setPlacementPlayersText('');

    setShowPlacementModal(true);

  };

  const openEditPlacement = (pl: Placement) => {

    setPlacementMode('edit');

    setEditingPlacementId(pl.id!);

    setPlacementForm({ game: pl.game, tournament: pl.tournament, team: pl.team, position: pl.position, players: pl.players, prize: pl.prize, logo: pl.logo });

    setPlacementPlayersText(pl.players.join(', '));

    setShowPlacementModal(true);

  };



  const openCreateMatch = () => {

    setMatchMode('create');

    setEditingMatchId(null);

    setMatchForm({ game: '', event: '', opponent: '', date: '', time: '', streamLink: '' });

    setShowMatchModal(true);

  };

  const openEditMatch = (m: Match) => {

    setMatchMode('edit');

    setEditingMatchId(m.id!);

    setMatchForm({ game: m.game, event: m.event, opponent: m.opponent, date: m.date, time: m.time, streamLink: m.streamLink });

    setShowMatchModal(true);

  };



  const submitProduct = async () => {

    try {
      console.log('Submitting product with images:', productForm.images);

      if (productMode === 'create') {

        const productId = await productService.create(productForm);
        console.log('Product created with ID:', productId, 'Images saved:', productForm.images);

        await logAction('create', 'product', productId, `Created product "${productForm.name}"`, {

          level: 'info',

          status: 'success',

          metadata: { category: productForm.category, price: productForm.price, imageCount: productForm.images?.length || 0 }

        });

      } else if (editingProductId) {

        // Get current product for change tracking

        const currentProducts = await productService.getAll();

        const currentProduct = currentProducts.find(p => p.id === editingProductId);

        console.log('Updating product - Current images:', currentProduct?.images, 'New images:', productForm.images);



        if (currentProduct) {

          const beforeSnapshot = {

            name: currentProduct.name,

            price: currentProduct.price,

            image: currentProduct.image,

            images: currentProduct.images,

            category: currentProduct.category,

            description: currentProduct.description,

            link: currentProduct.link,

            displayOnHomePage: currentProduct.displayOnHomePage

          };



          const afterSnapshot = {

            name: productForm.name,

            price: productForm.price,

            image: productForm.image,

            images: productForm.images,

            category: productForm.category,

            description: productForm.description,

            link: productForm.link,

            displayOnHomePage: productForm.displayOnHomePage

          };



          await productService.update(editingProductId, productForm);
          console.log('Product updated successfully - Images saved:', productForm.images);

          await logAction('update', 'product', editingProductId, `Updated product "${productForm.name}"`, {

            beforeSnapshot,

            afterSnapshot,

            level: 'info',

            status: 'success',

            metadata: { updatedFields: Object.keys(afterSnapshot), imageCount: productForm.images?.length || 0 }

          });

        } else {

          await productService.update(editingProductId, productForm);

          await logAction('update', 'product', editingProductId, `Updated product "${productForm.name}"`, {

            level: 'warn',

            status: 'warning',

            metadata: { note: 'Could not track changes - current product not found' }

          });

        }

      }

      await reloadProducts();

      setShowProductModal(false);

    } catch (e) {

      console.error(e);

      await logAction('error', 'product', editingProductId || 'unknown', `Failed to ${productMode} product`, {

        level: 'error',

        status: 'error',

        errorMessage: e instanceof Error ? e.message : 'Unknown error'

      });

    }

  };

  const submitNews = async () => {

    try {

      if (newsMode === 'create') {

        const newsId = await newsService.create({ ...newsForm, date: newsDate || undefined });

        await logAction('create', 'news', newsId, `Created news "${newsForm.title}"`, {

          level: 'info',

          status: 'success',

          metadata: { category: newsForm.category, hasImage: !!newsForm.image }

        });

      } else if (editingNewsId) {

        await newsService.update(editingNewsId, { ...newsForm, date: (newsDate as unknown) as any });

        await logAction('update', 'news', editingNewsId, `Updated news "${newsForm.title}"`, {

          level: 'info',

          status: 'success',

          metadata: { category: newsForm.category }

        });

      }

      setShowNewsModal(false);

    } catch (e) {

      console.error(e);

      await logAction('error', 'news', editingNewsId || 'unknown', `Failed to ${newsMode} news`, {

        level: 'error',

        status: 'error',

        errorMessage: e instanceof Error ? e.message : 'Unknown error'

      });

    }

  };

  const submitPlacement = async () => {

    try {

      const payload = { ...placementForm, players: placementPlayersText.split(',').map(s => s.trim()).filter(Boolean) };

      if (placementMode === 'create') {

        const placementId = await placementService.create(payload);

        await logAction('create', 'placement', placementId, `Created placement "${placementForm.tournament} - ${placementForm.team}"`, {

          level: 'info',

          status: 'success',

          metadata: { game: placementForm.game, position: placementForm.position, prize: placementForm.prize }

        });

      } else if (editingPlacementId) {

        await placementService.update(editingPlacementId, payload);

        await logAction('update', 'placement', editingPlacementId, `Updated placement "${placementForm.tournament} - ${placementForm.team}"`, {

          level: 'info',

          status: 'success',

          metadata: { game: placementForm.game, position: placementForm.position }

        });

      }

      setShowPlacementModal(false);

    } catch (e) {

      console.error(e);

      await logAction('error', 'placement', editingPlacementId || 'unknown', `Failed to ${placementMode} placement`, {

        level: 'error',

        status: 'error',

        errorMessage: e instanceof Error ? e.message : 'Unknown error'

      });

    }

  };

  const submitMatch = async () => {

    try {

      if (matchMode === 'create') {

        const matchId = await scheduleService.createMatch(matchForm);

        await logAction('create', 'match', matchId, `Created match "${matchForm.game} - ${matchForm.event}"`, {

          level: 'info',

          status: 'success',

          metadata: { opponent: matchForm.opponent, hasStream: !!matchForm.streamLink }

        });

      } else if (editingMatchId) {

        await scheduleService.updateMatch(editingMatchId, matchForm);

        await logAction('update', 'match', editingMatchId, `Updated match "${matchForm.game} - ${matchForm.event}"`, {

          level: 'info',

          status: 'success',

          metadata: { opponent: matchForm.opponent }

        });

      }

      setShowMatchModal(false);

    } catch (e) {

      console.error(e);

      await logAction('error', 'match', editingMatchId || 'unknown', `Failed to ${matchMode} match`, {

        level: 'error',

        status: 'error',

        errorMessage: e instanceof Error ? e.message : 'Unknown error'

      });

    }

  };



  const handleStatusChange = async (orderId: string, newStatus: any) => {

    try {

      await updateOrderStatus(orderId, newStatus);

      await logAction('update', 'order', orderId, `Updated order status to "${newStatus}"`, {

        level: 'info',

        status: 'success',

        metadata: { previousStatus: 'unknown', newStatus }

      });

    } catch (error) {

      console.error('Error updating order status:', error);

      await logAction('error', 'order', orderId, `Failed to update order status to "${newStatus}"`, {

        level: 'error',

        status: 'error',

        errorMessage: error instanceof Error ? error.message : 'Unknown error'

      });

    }

  };



  const handleDeleteOrder = async (orderId: string) => {

    if (confirm('Are you sure you want to delete this order?')) {

      try {

        await deleteOrder(orderId);

        await logAction('delete', 'order', orderId, `Deleted order`, {

          level: 'warn',

          status: 'success',

          metadata: { deletedBy: currentUser?.email }

        });

      } catch (error) {

        console.error('Error deleting order:', error);

        await logAction('error', 'order', orderId, `Failed to delete order`, {

          level: 'error',

          status: 'error',

          errorMessage: error instanceof Error ? error.message : 'Unknown error'

        });

      }

    }

  };



  const handleDeleteReview = async (reviewId: string) => {

    if (confirm('Are you sure you want to delete this review?')) {

      try {

        await reviewService.deleteReview(reviewId);

        setReviews(reviews.filter(review => review.id !== reviewId));

        await logAction('delete', 'review', reviewId, `Deleted review`, {

          level: 'warn',

          status: 'success',

          metadata: { deletedBy: currentUser?.email }

        });

      } catch (error) {

        console.error('Error deleting review:', error);

        await logAction('error', 'review', reviewId, `Failed to delete review`, {

          level: 'error',

          status: 'error',

          errorMessage: error instanceof Error ? error.message : 'Unknown error'

        });

      }

    }

  };



  const handleBulkDeleteReviews = async () => {

    if (confirm(`Are you sure you want to delete ${selectedReviews.size} reviews?`)) {

      try {

        const deletePromises = Array.from(selectedReviews).map(reviewId =>

          reviewService.deleteReview(reviewId)

        );

        await Promise.all(deletePromises);

        setReviews(reviews.filter(review => !selectedReviews.has(review.id || '')));

        setSelectedReviews(new Set());

        setShowBulkActions(false);



        await logAction('delete', 'review', 'bulk', `Bulk deleted ${selectedReviews.size} reviews`, {

          level: 'warn',

          status: 'success',

          bulkOperation: {

            count: selectedReviews.size,

            items: Array.from(selectedReviews),

            summary: `Bulk deletion of ${selectedReviews.size} reviews`

          },

          metadata: { deletedBy: currentUser?.email, operationType: 'bulk_delete' }

        });

      } catch (error) {

        console.error('Error bulk deleting reviews:', error);

        await logAction('error', 'review', 'bulk', `Failed bulk deletion of ${selectedReviews.size} reviews`, {

          level: 'error',

          status: 'error',

          errorMessage: error instanceof Error ? error.message : 'Unknown error'

        });

      }

    }

  };



  const toggleReviewSelection = (reviewId: string) => {

    const newSelection = new Set(selectedReviews);

    if (newSelection.has(reviewId)) {

      newSelection.delete(reviewId);

    } else {

      newSelection.add(reviewId);

    }

    setSelectedReviews(newSelection);

    setShowBulkActions(newSelection.size > 0);

  };



  // Team management functions

  const handleAddPlayer = async (teamId: string) => {

    if (!newPlayer.name.trim() || !newPlayer.role.trim() || !newPlayer.game.trim()) {

      alert('Please fill in name, role, and game fields');

      return;

    }



    try {

      setLoadingTeams(true);

      console.log('Adding player to team:', teamId, newPlayer);



      await teamService.addPlayer(teamId, newPlayer as Player);



      // Reload teams

      const updatedTeams = await teamService.getAll();

      console.log('Reloaded teams after adding player:', updatedTeams);

      setTeams(updatedTeams);



      // Reset form

      setNewPlayer({

        name: '',

        role: '',

        image: '',

        game: '',

        achievements: [],

        socialLinks: {}

      });

      setShowAddPlayer(false);

      setSelectedTeam(null);



      alert('Player added successfully! Changes should appear on the teams page.');

      await logAction('update', 'team', teamId, `Added player "${newPlayer.name}" to team`, {

        level: 'info',

        status: 'success',

        metadata: { playerName: newPlayer.name, playerRole: newPlayer.role, playerGame: newPlayer.game }

      });

    } catch (error) {

      console.error('Error adding player:', error);

      alert(`Failed to add player: ${error instanceof Error ? error.message : 'Unknown error'}`);

      await logAction('error', 'team', teamId, `Failed to add player "${newPlayer.name}" to team`, {

        level: 'error',

        status: 'error',

        errorMessage: error instanceof Error ? error.message : 'Unknown error'

      });

    } finally {

      setLoadingTeams(false);

    }

  };



  const handleEditPlayer = async (teamId: string, playerIndex: number, updatedPlayer: Player) => {

    try {

      setLoadingTeams(true);

      console.log('Updating player:', teamId, playerIndex, updatedPlayer);



      await teamService.updatePlayer(teamId, playerIndex, updatedPlayer);



      // Reload teams

      const updatedTeams = await teamService.getAll();

      console.log('Reloaded teams after player update:', updatedTeams);

      setTeams(updatedTeams);



      setEditingPlayer(null);

      alert('Player updated successfully! Changes should appear on the teams page.');

      await logAction('update', 'team', teamId, `Updated player "${updatedPlayer.name}" in team`, {

        level: 'info',

        status: 'success',

        metadata: { playerName: updatedPlayer.name, updatedFields: ['name', 'role', 'game', 'achievements'] }

      });

    } catch (error) {

      console.error('Error updating player:', error);

      alert(`Failed to update player: ${error instanceof Error ? error.message : 'Unknown error'}`);

      await logAction('error', 'team', teamId, `Failed to update player "${updatedPlayer.name}" in team`, {

        level: 'error',

        status: 'error',

        errorMessage: error instanceof Error ? error.message : 'Unknown error'

      });

    } finally {

      setLoadingTeams(false);

    }

  };



  const handleDeletePlayer = async (teamId: string, playerIndex: number) => {

    if (!confirm('Are you sure you want to remove this player?')) return;



    try {

      setLoadingTeams(true);

      await teamService.removePlayer(teamId, playerIndex);



      // Reload teams

      const updatedTeams = await teamService.getAll();

      setTeams(updatedTeams);



      alert('Player removed successfully!');

      await logAction('update', 'team', teamId, `Removed player from team`, {

        level: 'warn',

        status: 'success',

        metadata: { playerIndex, removedBy: currentUser?.email }

      });

    } catch (error) {

      console.error('Error removing player:', error);

      alert('Failed to remove player');

      await logAction('error', 'team', teamId, `Failed to remove player from team`, {

        level: 'error',

        status: 'error',

        errorMessage: error instanceof Error ? error.message : 'Unknown error'

      });

    } finally {

      setLoadingTeams(false);

    }

  };



  const handleCreateTeam = async () => {

    if (!newTeam.name.trim() || !newTeam.description.trim()) {

      alert('Please fill in team name and description');

      return;

    }



    try {

      setLoadingTeams(true);

      const teamId = await teamService.create(newTeam);



      // Reload teams

      const updatedTeams = await teamService.getAll();

      setTeams(updatedTeams);



      // Reset form

      setNewTeam({

        name: '',

        image: '',

        description: '',

        achievements: [],

        players: []

      });

      setShowCreateTeam(false);



      alert('Team created successfully!');

      await logAction('create', 'team', teamId, `Created team "${newTeam.name}"`, {

        level: 'info',

        status: 'success',

        metadata: { hasImage: !!newTeam.image, playerCount: 0 }

      });

    } catch (error) {

      console.error('Error creating team:', error);

      alert('Failed to create team');

      await logAction('error', 'team', 'unknown', `Failed to create team "${newTeam.name}"`, {

        level: 'error',

        status: 'error',

        errorMessage: error instanceof Error ? error.message : 'Unknown error'

      });

    } finally {

      setLoadingTeams(false);

    }

  };



  const handleDeleteTeam = async (teamId: string, teamName: string) => {

    if (!confirm(`Are you sure you want to delete the team "${teamName}"? This will remove all players and cannot be undone.`)) return;



    try {

      setLoadingTeams(true);

      await teamService.remove(teamId);



      // Reload teams

      const updatedTeams = await teamService.getAll();

      setTeams(updatedTeams);



      alert('Team deleted successfully!');

      await logAction('delete', 'team', teamId, `Deleted team "${teamName}"`, {

        level: 'warn',

        status: 'success',

        metadata: { teamName, deletedBy: currentUser?.email }

      });

    } catch (error) {

      console.error('Error deleting team:', error);

      alert('Failed to delete team');

      await logAction('error', 'team', teamId, `Failed to delete team "${teamName}"`, {

        level: 'error',

        status: 'error',

        errorMessage: error instanceof Error ? error.message : 'Unknown error'

      });

    } finally {

      setLoadingTeams(false);

    }

  };



  const handleEditTeam = (team: Team) => {

    setEditingTeam(team);

    setShowEditTeam(true);

  };



  const handleUpdateTeam = async () => {

    if (!editingTeam || !editingTeam.name.trim() || !editingTeam.description.trim()) {

      alert('Please fill in team name and description');

      return;

    }



    try {

      setLoadingTeams(true);

      console.log('Updating team:', editingTeam.id, editingTeam);



      await teamService.update(editingTeam.id!, {

        name: editingTeam.name,

        image: editingTeam.image,

        description: editingTeam.description,

        achievements: editingTeam.achievements,

        players: editingTeam.players

      });



      console.log('Team updated in Firebase, reloading...');



      // Reload teams

      const updatedTeams = await teamService.getAll();

      console.log('Reloaded teams:', updatedTeams);

      setTeams(updatedTeams);



      setShowEditTeam(false);

      setEditingTeam(null);



      alert('Team updated successfully! Changes should appear on the teams page.');

      await logAction('update', 'team', editingTeam.id!, `Updated team "${editingTeam.name}"`, {

        level: 'info',

        status: 'success',

        metadata: { playerCount: editingTeam.players.length, updatedFields: ['name', 'description', 'image'] }

      });

    } catch (error) {

      console.error('Error updating team:', error);

      alert(`Failed to update team: ${error instanceof Error ? error.message : 'Unknown error'}`);

      await logAction('error', 'team', editingTeam?.id || 'unknown', `Failed to update team "${editingTeam?.name}"`, {

        level: 'error',

        status: 'error',

        errorMessage: error instanceof Error ? error.message : 'Unknown error'

      });

    } finally {

      setLoadingTeams(false);

    }

  };



  const handleCreateAmbassador = async () => {

    try {

      setLoadingAmbassadors(true);

      const ambassadorId = await ambassadorService.create(ambassadorForm);

      const updatedAmbassadors = await ambassadorService.getAll();

      setAmbassadors(updatedAmbassadors);

      setShowCreateAmbassador(false);

      setAmbassadorForm({

        name: '',

        role: 'Ambassador',

        image: '',

        game: '',

        achievements: [],

        socialLinks: {}

      });

      await logAction('create', 'ambassador', ambassadorId, `Created ambassador "${ambassadorForm.name}"`, {

        level: 'info',

        status: 'success',

        metadata: { role: ambassadorForm.role, game: ambassadorForm.game, hasImage: !!ambassadorForm.image }

      });

    } catch (error) {

      console.error('Error creating ambassador:', error);

      alert('Failed to create ambassador');

      await logAction('error', 'ambassador', 'unknown', `Failed to create ambassador "${ambassadorForm.name}"`, {

        level: 'error',

        status: 'error',

        errorMessage: error instanceof Error ? error.message : 'Unknown error'

      });

    } finally {

      setLoadingAmbassadors(false);

    }

  };



  const handleUpdateProductCustomization = async () => {

    if (!selectedProductForCustomization) return;



    try {
      const updateData: any = {
        hasCustomFields: customizationForm.hasCustomFields,
        hasSizes: customizationForm.hasSizes,
        hasSizeChart: customizationForm.hasSizeChart,
      };

      if (customizationForm.hasCustomFields) {

        updateData.customFields = customizationForm.customFields;

      }



      if (customizationForm.hasSizes) {

        updateData.sizes = customizationForm.sizes;

      }



      await productService.update(selectedProductForCustomization.id!, updateData);



      // Reload products to reflect changes

      await reloadProducts();

      setSelectedProductForCustomization(null);



      await logAction('update', 'product', selectedProductForCustomization.id!, `Updated customization settings for "${selectedProductForCustomization.name}"`, {

        level: 'info',

        status: 'success',

        metadata: {
          hasCustomFields: customizationForm.hasCustomFields,
          hasSizes: customizationForm.hasSizes,
          hasSizeChart: customizationForm.hasSizeChart,
          customFieldsCount: customizationForm.customFields.length,
          sizesCount: customizationForm.sizes.length
        }

      });



      alert('Product customization updated successfully!');

    } catch (error) {

      console.error('Error updating product customization:', error);

      alert('Failed to update product customization');

      await logAction('error', 'product', selectedProductForCustomization.id!, `Failed to update customization for "${selectedProductForCustomization.name}"`, {

        level: 'error',

        status: 'error',

        errorMessage: error instanceof Error ? error.message : 'Unknown error'

      });

    }

  };



  const handleUpdateAmbassador = async () => {

    if (!editingAmbassador) return;

    try {

      setLoadingAmbassadors(true);

      await ambassadorService.update(editingAmbassador.id!, ambassadorForm);

      const updatedAmbassadors = await ambassadorService.getAll();

      setAmbassadors(updatedAmbassadors);

      setShowCreateAmbassador(false);

      setEditingAmbassador(null);

      setAmbassadorForm({

        name: '',

        role: 'Ambassador',

        image: '',

        game: '',

        achievements: [],

        socialLinks: {}

      });

      await logAction('update', 'ambassador', editingAmbassador.id!, `Updated ambassador "${ambassadorForm.name}"`, {

        level: 'info',

        status: 'success',

        metadata: { updatedFields: ['name', 'role', 'game', 'achievements', 'socialLinks'] }

      });

    } catch (error) {

      console.error('Error updating ambassador:', error);

      alert('Failed to update ambassador');

      await logAction('error', 'ambassador', editingAmbassador.id!, `Failed to update ambassador "${ambassadorForm.name}"`, {

        level: 'error',

        status: 'error',

        errorMessage: error instanceof Error ? error.message : 'Unknown error'

      });

    } finally {

      setLoadingAmbassadors(false);

    }

  };



  const openCreateAmbassadorModal = () => {

    setEditingAmbassador(null);

    setAmbassadorForm({

      name: '',

      role: 'Ambassador',

      image: '',

      game: '',

      achievements: [],

      socialLinks: {}

    });

    setShowCreateAmbassador(true);

  };



  const openEditAmbassadorModal = (ambassador: Ambassador) => {

    setEditingAmbassador(ambassador);

    setAmbassadorForm({

      name: ambassador.name,

      role: ambassador.role,

      image: ambassador.image,

      game: ambassador.game,

      achievements: ambassador.achievements,

      socialLinks: ambassador.socialLinks

    });

    setShowCreateAmbassador(true);

  };



  const handleDeleteAmbassador = async (ambassadorId: string) => {

    if (!confirm('Are you sure you want to delete this ambassador?')) return;



    try {

      setLoadingAmbassadors(true);

      await ambassadorService.remove(ambassadorId);

      setAmbassadors(ambassadors.filter(a => a.id !== ambassadorId));

      await logAction('delete', 'ambassador', ambassadorId, `Deleted ambassador`, {

        level: 'warn',

        status: 'success',

        metadata: { deletedBy: currentUser?.email }

      });

    } catch (error) {

      console.error('Error deleting ambassador:', error);

      alert('Failed to delete ambassador');

      await logAction('error', 'ambassador', ambassadorId, `Failed to delete ambassador`, {

        level: 'error',

        status: 'error',

        errorMessage: error instanceof Error ? error.message : 'Unknown error'

      });

    } finally {

      setLoadingAmbassadors(false);

    }

  };



  const movePlayer = (direction: 'up' | 'down', playerIndex: number) => {

    if (!editingTeam) return;



    const newIndex = direction === 'up' ? playerIndex - 1 : playerIndex + 1;

    if (newIndex < 0 || newIndex >= editingTeam.players.length) return;



    const updatedPlayers = [...editingTeam.players];

    [updatedPlayers[playerIndex], updatedPlayers[newIndex]] = [updatedPlayers[newIndex], updatedPlayers[playerIndex]];



    setEditingTeam({

      ...editingTeam,

      players: updatedPlayers

    });

  };



  const removePlayerFromTeam = (playerIndex: number) => {

    if (!editingTeam) return;



    const updatedPlayers = editingTeam.players.filter((_, index) => index !== playerIndex);

    setEditingTeam({

      ...editingTeam,

      players: updatedPlayers

    });

  };



  const handleMovePlayer = async (teamId: string, playerIndex: number, direction: 'up' | 'down') => {

    try {

      setLoadingTeams(true);



      // Get the current team

      const team = teams.find(t => t.id === teamId);

      if (!team || !team.players) return;



      const newIndex = direction === 'up' ? playerIndex - 1 : playerIndex + 1;

      if (newIndex < 0 || newIndex >= team.players.length) return;



      // Create new players array with swapped positions

      const updatedPlayers = [...team.players];

      [updatedPlayers[playerIndex], updatedPlayers[newIndex]] = [updatedPlayers[newIndex], updatedPlayers[playerIndex]];



      // Update the team in Firebase

      await teamService.update(teamId, {

        players: updatedPlayers

      });



      // Reload teams to reflect changes

      const updatedTeams = await teamService.getAll();

      setTeams(updatedTeams);



    } catch (error) {

      console.error('Error moving player:', error);

      alert('Failed to move player');

    } finally {

      setLoadingTeams(false);

    }

    await logAction('update', 'team', teamId, `Moved player position in team`, {

      level: 'info',

      status: 'success',

      metadata: { movedBy: currentUser?.email, direction }

    });

  };



  // Statistics calculations

  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);

  const totalOrders = orders.length;

  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const pendingOrders = orders.filter(order => order.status === 'pending').length;

  const completedOrders = orders.filter(order => order.status === 'delivered').length;

  const averageRating = reviews.length > 0

    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length

    : 0;



  const filteredOrders = filterStatus === 'all'

    ? orders

    : orders.filter(order => order.status === filterStatus);



  const getStatusColor = (status: Order['status']) => {

    return statusColors[status] || 'bg-gray-900/20 text-gray-400 border-gray-500/20';

  };



  if (loading) {

    return <LoadingScreen message="SYNCING DASHBOARD" />;

  }



  const formatTimestamp = (timestamp: any) => {

    if (!timestamp) return '';

    const date = timestamp.toDate();

    return date.toLocaleString();

  };



  return (

    <div className="min-h-screen bg-gradient-to-br from-[#0A0A0A] via-[#1A1A1A] to-[#0F0F0F] p-3 sm:p-6">

      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">

        {/* Navigation Tabs */}

        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-1">

          <div className="flex space-x-1 overflow-x-auto scrollbar-hide">

            {[

              { id: 'products', label: 'Products', icon: UserIcon },

              { id: 'teams', label: 'Teams', icon: UserIcon },

              { id: 'ambassadors', label: 'Ambassadors', icon: UserGroupIcon },

              { id: 'news', label: 'News', icon: NewspaperIcon },

              { id: 'placements', label: 'Placements', icon: TrophyIcon },

              { id: 'schedule', label: 'Schedule', icon: CalendarIcon },

              { id: 'socials', label: 'Socials', icon: LinkIcon },

              { id: 'users', label: 'Users', icon: UserPlusIcon },

              { id: 'reviews', label: 'Reviews', icon: StarIcon },

              { id: 'logs', label: 'Logs', icon: DocumentIcon },

              { id: 'support', label: 'Support', icon: ChatBubbleLeftRightIcon },

            ].map((tab) => (

              <button

                key={tab.id}

                onClick={() => setActiveTab(tab.id as any)}

                className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg font-medium transition-all duration-300 whitespace-nowrap text-sm sm:text-base ${

                  activeTab === tab.id

                    ? 'bg-[#FFFFFF] text-black'

                    : 'text-gray-400 hover:text-white hover:bg-[#2A2A2A]'

                }`}

              >

                <tab.icon className="w-4 h-4 flex-shrink-0" />

                <span className="hidden sm:inline">{tab.label}</span>

                <span className="sm:hidden">{tab.label.split(' ')[0]}</span>

              </button>

            ))}

          </div>

        </div>



        {/* Product Modal */}

        {showProductModal && (

          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">

            <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl max-w-lg w-full">

              <div className="p-6">

                <div className="flex justify-between items-center mb-4">

                  <h3 className="text-xl font-bold text-white">{productMode === 'create' ? 'Create' : 'Edit'} Product</h3>

                  <button onClick={() => setShowProductModal(false)} className="text-gray-400 hover:text-white">✕</button>

                </div>

                <div className="grid grid-cols-1 gap-3">

                  <input className="bg-[#0F0F0F] border border-[#2A2A2A] rounded px-3 py-2 text-white" placeholder="Name" value={productForm.name} onChange={e => setProductForm({ ...productForm, name: e.target.value })} />

                  <input type="number" className="bg-[#0F0F0F] border border-[#2A2A2A] rounded px-3 py-2 text-white" placeholder="Price" value={productForm.price} onChange={e => setProductForm({ ...productForm, price: Number(e.target.value) })} />

                  <input className="bg-[#0F0F0F] border border-[#2A2A2A] rounded px-3 py-2 text-white" placeholder="Category" value={productForm.category} onChange={e => setProductForm({ ...productForm, category: e.target.value })} />

                  <input className="bg-[#0F0F0F] border border-[#2A2A2A] rounded px-3 py-2 text-white" placeholder="Image URL" value={productForm.image} onChange={e => setProductForm({ ...productForm, image: e.target.value })} />

                  {productForm.image?.trim() && (

                    <div className="h-40 rounded border border-[#2A2A2A] overflow-hidden"><img src={productForm.image} className="object-contain w-full h-full" /></div>

                  )}



                  {/* Additional Images */}

                  <div className="space-y-3">

                    <div className="flex items-center justify-between">

                      <label className="text-sm font-medium text-gray-300">Additional Images</label>

                      <button

                        type="button"

                        onClick={addImageField}

                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"

                      >

                        + Add Image

                      </button>

                    </div>

                    {(productForm.images || []).map((imageUrl, index) => (

                      <div key={index} className="space-y-2">

                        <div className="flex gap-2">

                          <input

                            className="flex-1 bg-[#0F0F0F] border border-[#2A2A2A] rounded px-3 py-2 text-white text-sm"

                            placeholder={`Additional Image ${index + 1} URL`}

                            value={imageUrl}

                            onChange={(e) => updateImageField(index, e.target.value)}

                          />

                          <button

                            type="button"

                            onClick={() => removeImageField(index)}

                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"

                          >

                            Remove

                          </button>

                        </div>

                        {imageUrl?.trim() && (

                          <div className="h-32 rounded border border-[#2A2A2A] overflow-hidden">

                            <img src={imageUrl} className="object-contain w-full h-full" />

                          </div>

                        )}

                      </div>

                    ))}

                  </div>

                  <input className="bg-[#0F0F0F] border border-[#2A2A2A] rounded px-3 py-2 text-white" placeholder="Product Link" value={productForm.link} onChange={e => setProductForm({ ...productForm, link: e.target.value })} />

                  <textarea className="bg-[#0F0F0F] border border-[#2A2A2A] rounded px-3 py-2 text-white h-24" placeholder="Description" value={productForm.description} onChange={e => setProductForm({ ...productForm, description: e.target.value })} />

                </div>

                <div className="flex gap-3 mt-4">

                  <button onClick={() => setShowProductModal(false)} className="flex-1 bg-[#2A2A2A] hover:bg-[#3A3A3A] text-white py-2 rounded">Cancel</button>

                  <button onClick={submitProduct} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded">Save</button>

                </div>

              </div>

            </div>

          </div>

        )}



        {/* News Modal */}

        {showNewsModal && (

          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">

            <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl max-w-lg w-full">

              <div className="p-6">

                <div className="flex justify-between items-center mb-4">

                  <h3 className="text-xl font-bold text-white">{newsMode === 'create' ? 'Create' : 'Edit'} News</h3>

                  <button onClick={() => setShowNewsModal(false)} className="text-gray-400 hover:text-white">✕</button>

                </div>

                <div className="grid grid-cols-1 gap-3">

                  <input className="bg-[#0F0F0F] border border-[#2A2A2A] rounded px-3 py-2 text-white" placeholder="Title" value={newsForm.title} onChange={e => setNewsForm({ ...newsForm, title: e.target.value })} />

                  <input className="bg-[#0F0F0F] border border-[#2A2A2A] rounded px-3 py-2 text-white" placeholder="Image URL" value={newsForm.image} onChange={e => setNewsForm({ ...newsForm, image: e.target.value })} />

                  {newsForm.image?.trim() && (

                    <div className="h-40 rounded border border-[#2A2A2A] overflow-hidden"><img src={newsForm.image} className="object-contain w-full h-full" /></div>

                  )}

                  <input className="bg-[#0F0F0F] border border-[#2A2A2A] rounded px-3 py-2 text-white" placeholder="Category" value={newsForm.category} onChange={e => setNewsForm({ ...newsForm, category: e.target.value })} />

                  <input type="datetime-local" className="bg-[#0F0F0F] border border-[#2A2A2A] rounded px-3 py-2 text-white" value={newsDate} onChange={e => setNewsDate(e.target.value)} />

                  <textarea className="bg-[#0F0F0F] border border-[#2A2A2A] rounded px-3 py-2 text-white h-24" placeholder="Description" value={newsForm.description} onChange={e => setNewsForm({ ...newsForm, description: e.target.value })} />

                </div>

                <div className="flex gap-3 mt-4">

                  <button onClick={() => setShowNewsModal(false)} className="flex-1 bg-[#2A2A2A] hover:bg-[#3A3A3A] text-white py-2 rounded">Cancel</button>

                  <button onClick={submitNews} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded">Save</button>

                </div>

              </div>

            </div>

          </div>

        )}



        {/* Placement Modal */}

        {showPlacementModal && (

          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">

            <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl max-w-lg w-full">

              <div className="p-6">

                <div className="flex justify-between items-center mb-4">

                  <h3 className="text-xl font-bold text-white">{placementMode === 'create' ? 'Add' : 'Edit'} Placement</h3>

                  <button onClick={() => setShowPlacementModal(false)} className="text-gray-400 hover:text-white">✕</button>

                </div>

                <div className="grid grid-cols-1 gap-3">

                  <input className="bg-[#0F0F0F] border border-[#2A2A2A] rounded px-3 py-2 text-white" placeholder="Game" value={placementForm.game} onChange={e => setPlacementForm({ ...placementForm, game: e.target.value })} />

                  <input className="bg-[#0F0F0F] border border-[#2A2A2A] rounded px-3 py-2 text-white" placeholder="Tournament" value={placementForm.tournament} onChange={e => setPlacementForm({ ...placementForm, tournament: e.target.value })} />

                  <input className="bg-[#0F0F0F] border border-[#2A2A2A] rounded px-3 py-2 text-white" placeholder="Team" value={placementForm.team} onChange={e => setPlacementForm({ ...placementForm, team: e.target.value })} />

                  <input className="bg-[#0F0F0F] border border-[#2A2A2A] rounded px-3 py-2 text-white" placeholder="Position" value={placementForm.position} onChange={e => setPlacementForm({ ...placementForm, position: e.target.value })} />

                  <input className="bg-[#0F0F0F] border border-[#2A2A2A] rounded px-3 py-2 text-white" placeholder="Prize (optional)" value={placementForm.prize || ''} onChange={e => setPlacementForm({ ...placementForm, prize: e.target.value })} />

                  <input className="bg-[#0F0F0F] border border-[#2A2A2A] rounded px-3 py-2 text-white" placeholder="Logo URL" value={placementForm.logo} onChange={e => setPlacementForm({ ...placementForm, logo: e.target.value })} />

                  {placementForm.logo?.trim() && (<div className="h-32 rounded border border-[#2A2A2A] overflow-hidden"><img src={placementForm.logo} className="object-contain w-full h-full" /></div>)}

                  <textarea className="bg-[#0F0F0F] border border-[#2A2A2A] rounded px-3 py-2 text-white h-20" placeholder="Players (comma separated)" value={placementPlayersText} onChange={e => setPlacementPlayersText(e.target.value)} />

                </div>

                <div className="flex gap-3 mt-4">

                  <button onClick={() => setShowPlacementModal(false)} className="flex-1 bg-[#2A2A2A] hover:bg-[#3A3A3A] text-white py-2 rounded">Cancel</button>

                  <button onClick={submitPlacement} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded">Save</button>

                </div>

              </div>

            </div>

          </div>

        )}



        {/* Match Modal */}

        {showMatchModal && (

          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">

            <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl max-w-lg w-full">

              <div className="p-6">

                <div className="flex justify-between items-center mb-4">

                  <h3 className="text-xl font-bold text-white">{matchMode === 'create' ? 'Add' : 'Edit'} Match/Event</h3>

                  <button onClick={() => setShowMatchModal(false)} className="text-gray-400 hover:text-white">✕</button>

                </div>

                <div className="grid grid-cols-1 gap-3">

                  <input className="bg-[#0F0F0F] border border-[#2A2A2A] rounded px-3 py-2 text-white" placeholder="Game" value={matchForm.game} onChange={e => setMatchForm({ ...matchForm, game: e.target.value })} />

                  <input className="bg-[#0F0F0F] border border-[#2A2A2A] rounded px-3 py-2 text-white" placeholder="Event" value={matchForm.event} onChange={e => setMatchForm({ ...matchForm, event: e.target.value })} />

                  <input className="bg-[#0F0F0F] border border-[#2A2A2A] rounded px-3 py-2 text-white" placeholder="Opponent" value={matchForm.opponent} onChange={e => setMatchForm({ ...matchForm, opponent: e.target.value })} />

                  <input type="date" className="bg-[#0F0F0F] border border-[#2A2A2A] rounded px-3 py-2 text-white" value={matchForm.date} onChange={e => setMatchForm({ ...matchForm, date: e.target.value })} />

                  <input type="time" className="bg-[#0F0F0F] border border-[#2A2A2A] rounded px-3 py-2 text-white" value={matchForm.time} onChange={e => setMatchForm({ ...matchForm, time: e.target.value })} />

                  <input className="bg-[#0F0F0F] border border-[#2A2A2A] rounded px-3 py-2 text-white" placeholder="Stream Link" value={matchForm.streamLink} onChange={e => setMatchForm({ ...matchForm, streamLink: e.target.value })} />

                </div>

                <div className="flex gap-3 mt-4">

                  <button onClick={() => setShowMatchModal(false)} className="flex-1 bg-[#2A2A2A] hover:bg-[#3A3A3A] text-white py-2 rounded">Cancel</button>

                  <button onClick={submitMatch} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded">Save</button>

                </div>

              </div>

            </div>

          </div>

        )}

        {/* News Tab */}
        {activeTab === 'news' && (
          <NewsTab onLogAction={logAction} />
        )}




        {activeTab === 'placements' && (
          <PlacementsTab onLogAction={logAction} />
        )}



        {/* Schedule Tab */}

        {activeTab === 'schedule' && (

          <div className="space-y-6">

            <AnimatedCard className="admin-card p-6">

              <div className="flex items-center justify-between mb-4">

                <h2 className="text-xl font-bold text-white flex items-center gap-2">

                  Manage Schedule

                </h2>

                <div className="flex gap-2">

                  <button

                    onClick={() => router.push('/adminpanel/schedule')}

                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"

                  >

                    Open Schedule Manager

                  </button>

                  <button

                    onClick={() => openCreateMatch()}

                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium"

                  >

                    Add Match/Event

                  </button>

                </div>

              </div>

              <p className="text-gray-400 text-sm">Create or edit matches, dates, teams, and status from the Schedule Manager page.</p>

            </AnimatedCard>

          </div>

        )}



        {/* Socials Tab */}

        {activeTab === 'socials' && (

          <div className="space-y-6">

            <AnimatedCard className="admin-card p-6">

              <div className="flex items-center justify-between mb-4">

                <h2 className="text-xl font-bold text-white flex items-center gap-2">

                  <LinkIcon className="w-6 h-6" />

                  Social Media Management

                </h2>

                <div className="flex gap-2">

                  <button

                    onClick={() => router.push('/adminpanel/socials')}

                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"

                  >

                    Open Socials Manager

                  </button>

                </div>

              </div>

              <p className="text-gray-400 text-sm">Manage social media links displayed on the website footer and other pages.</p>

            </AnimatedCard>

          </div>

        )}



        {/* Users Tab */}

        {activeTab === 'users' && (

          <div className="space-y-6">

            <AnimatedCard className="admin-card p-6">

              <div className="flex items-center justify-between mb-6">

                <h2 className="text-xl font-bold text-white flex items-center gap-2">

                  <UserPlusIcon className="w-6 h-6" />

                  Admin User Management

                </h2>

                <button

                  onClick={() => setShowCreateUser(!showCreateUser)}

                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"

                >

                  <UserPlusIcon className="w-4 h-4" />

                  {showCreateUser ? 'Cancel' : 'Create New User'}

                </button>

              </div>



              {showCreateUser && (

                <div className="bg-[#0F0F0F] rounded-lg p-6 border border-[#2A2A2A] mb-6">

                  <h3 className="text-lg font-semibold text-white mb-4">Create New Admin User</h3>

                  <div className="space-y-4">

                    <div>

                      <label className="block text-sm font-medium text-gray-300 mb-2">

                        Email

                      </label>

                      <input

                        type="email"

                        value={newUserEmail}

                        onChange={(e) => setNewUserEmail(e.target.value)}

                        className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#FFFFFF]"

                        placeholder="user@example.com"

                      />

                    </div>

                    <div>

                      <label className="block text-sm font-medium text-gray-300 mb-2">

                        Password (minimum 6 characters)

                      </label>

                      <input

                        type="password"

                        value={newUserPassword}

                        onChange={(e) => setNewUserPassword(e.target.value)}

                        className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#FFFFFF]"

                        placeholder="Enter password"

                      />

                    </div>

                    <button

                      onClick={handleCreateUser}

                      disabled={creatingUser}

                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"

                    >

                      {creatingUser ? 'Creating...' : 'Create User'}

                    </button>

                  </div>

                </div>

              )}



              <div className="bg-[#0F0F0F] rounded-lg p-6 border border-[#2A2A2A]">

                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">

                  <KeyIcon className="w-5 h-5" />

                  Current User

                </h3>

                {currentUser ? (

                  <div className="space-y-2">

                    <p className="text-gray-300">

                      <span className="font-medium">Email:</span> {currentUser.email}

                    </p>

                    <p className="text-gray-400 text-sm">

                      <span className="font-medium">User ID:</span> {currentUser.uid}

                    </p>

                    <p className="text-gray-400 text-sm">

                      All authenticated Firebase users can access the admin panel. Create new users above to give them access.

                    </p>

                  </div>

                ) : (

                  <p className="text-gray-400">Not logged in</p>

                )}

              </div>



              <div className="mt-6 p-4 bg-blue-900/20 border border-blue-500/20 rounded-lg">

                <p className="text-blue-300 text-sm">

                  <strong>Note:</strong> All users created here will have full admin access to the admin panel.

                  Make sure to only create accounts for trusted team members. Each user will need to log in with

                  their own email and password at the admin panel login page.

                </p>

              </div>

            </AnimatedCard>

          </div>

        )}



        {/* Logs Tab */}

        {activeTab === 'logs' && (

          <div className="space-y-6">

            <AnimatedCard className="admin-card p-6">

              <div className="flex items-center justify-between mb-6">

                <h2 className="text-xl font-bold text-white flex items-center gap-2">

                  <DocumentIcon className="w-6 h-6" />

                  Admin Activity Logs

                </h2>

              </div>

              <p className="text-gray-400 text-sm mb-4">View all administrative actions and changes made in the admin panel.</p>

              

              {loadingLogs ? (

                <div className="text-center py-12">

                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#FFFFFF] mx-auto mb-2"></div>

                  <p className="text-gray-400">Loading logs...</p>

                </div>

              ) : logs.length === 0 ? (

                <div className="text-center py-12">

                  <p className="text-gray-400">No logs available yet. Actions in the admin panel will be logged here.</p>

                </div>

              ) : (

                <div className="space-y-4">

                  {logs.map((log) => (

                    <div key={log.id} className="bg-[#0F0F0F] rounded-lg p-4 border border-[#2A2A2A] hover:bg-[#1A1A1A] transition-colors">

                      <div className="flex items-start justify-between mb-3">

                        <div className="flex items-center gap-2">

                          {/* Log Level Badge */}

                          <span className={`px-2 py-1 rounded text-xs font-medium ${

                            (log.level || 'info') === 'error' ? 'bg-red-900/20 text-red-400 border border-red-500/20' :

                            (log.level || 'info') === 'warn' ? 'bg-yellow-900/20 text-yellow-400 border border-yellow-500/20' :

                            (log.level || 'info') === 'info' ? 'bg-blue-900/20 text-blue-400 border border-blue-500/20' :

                            'bg-gray-900/20 text-gray-400 border border-gray-500/20'

                          }`}>

                            {(log.level || 'info').toUpperCase()}

                          </span>



                          {/* Action Badge */}

                          <span className={`px-2 py-1 rounded text-xs font-medium ${

                            log.action === 'create' ? 'bg-green-900/20 text-green-400 border border-green-500/20' :

                            log.action === 'update' ? 'bg-blue-900/20 text-blue-400 border border-blue-500/20' :

                            log.action === 'delete' ? 'bg-red-900/20 text-red-400 border border-red-500/20' :

                            log.action === 'error' ? 'bg-red-900/20 text-red-400 border border-red-500/20' :

                            'bg-gray-900/20 text-gray-400 border border-gray-500/20'

                          }`}>

                            {log.action.toUpperCase()}

                          </span>



                          {/* Status Badge */}

                          <span className={`px-2 py-1 rounded text-xs font-medium ${

                            (log.status || 'success') === 'success' ? 'bg-green-900/20 text-green-400 border border-green-500/20' :

                            (log.status || 'success') === 'error' ? 'bg-red-900/20 text-red-400 border border-red-500/20' :

                            'bg-yellow-900/20 text-yellow-400 border border-yellow-500/20'

                          }`}>

                            {(log.status || 'success').toUpperCase()}

                          </span>



                          <span className="text-gray-400 text-sm capitalize">{log.entity}</span>

                        </div>



                        {/* Duration & Timestamp */}

                        <div className="text-right text-xs text-gray-500">

                          <div>{log.duration ? `${log.duration}ms` : ''}</div>

                          <div>{new Date(log.timestamp.toDate()).toLocaleString()}</div>

                        </div>

                      </div>



                      <div className="space-y-2">

                        <p className="text-white text-sm">{log.details}</p>



                        {/* Error Message */}

                        {log.errorMessage && (

                          <div className="bg-red-900/10 border border-red-500/20 rounded p-2">

                            <p className="text-red-400 text-xs font-medium">Error: {log.errorMessage}</p>

                          </div>

                        )}



                        {/* Change Tracking */}

                        {log.action === 'update' && log.changes && log.changes.length > 0 && (

                          <div className="bg-blue-900/10 border border-blue-500/20 rounded p-3">

                            <p className="text-blue-300 text-sm font-medium mb-2">Changes Made:</p>

                            <div className="space-y-1 max-h-32 overflow-y-auto">

                              {log.changes.map((change, index) => (

                                <div key={index} className="text-xs flex items-center gap-2">

                                  <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${

                                    change.impact === 'major' ? 'bg-red-900/20 text-red-400' :

                                    change.impact === 'minor' ? 'bg-yellow-900/20 text-yellow-400' :

                                    'bg-gray-900/20 text-gray-400'

                                  }`}>

                                    {change.changeType}

                                  </span>

                                  <span className="text-gray-400 font-mono">{change.field}:</span>

                                  {change.changeType === 'added' && (

                                    <span className="text-green-400">+ {JSON.stringify(change.newValue)}</span>

                                  )}

                                  {change.changeType === 'removed' && (

                                    <span className="text-red-400">- {JSON.stringify(change.oldValue)}</span>

                                  )}

                                  {change.changeType === 'modified' && (

                                    <>

                                      <span className="text-red-400 line-through">{JSON.stringify(change.oldValue)}</span>

                                      <span className="text-gray-400">→</span>

                                      <span className="text-green-400">{JSON.stringify(change.newValue)}</span>

                                    </>

                                  )}

                                </div>

                              ))}

                            </div>

                          </div>

                        )}



                        {/* Bulk Operation Info */}

                        {log.bulkOperation && (

                          <div className="bg-purple-900/10 border border-purple-500/20 rounded p-2">

                            <p className="text-purple-300 text-xs">

                              Bulk Operation: {log.bulkOperation.summary} ({log.bulkOperation.count} items)

                            </p>

                          </div>

                        )}



                        {/* Metadata */}

                        {log.metadata && Object.keys(log.metadata).length > 0 && (

                          <div className="bg-gray-900/10 border border-gray-500/20 rounded p-2">

                            <p className="text-gray-300 text-xs font-medium mb-1">Metadata:</p>

                            <div className="text-xs text-gray-400 space-y-0.5">

                              {Object.entries(log.metadata)

                                .filter(([key]) => !['sessionId', 'requestId', 'userAgent', 'timestamp'].includes(key))

                                .map(([key, value]) => (

                                  <div key={key} className="flex justify-between">

                                    <span className="font-mono">{key}:</span>

                                    <span className="truncate ml-2" title={String(value)}>

                                      {Array.isArray(value) ? `[${value.length} items]` : String(value)}

                                    </span>

                                  </div>

                                ))}

                            </div>

                          </div>

                        )}



                        <div className="flex items-center justify-between text-gray-500 text-xs pt-2 border-t border-[#2A2A2A]">

                          <span>By {log.adminEmail}</span>

                          <span>ID: {log.entityId}</span>

                        </div>

                      </div>

                    </div>

                  ))}

                </div>

              )}

            </AnimatedCard>

          </div>

        )}


        {/* Reviews Tab */}
        {activeTab === 'reviews' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">Review Management</h2>
              <button
                onClick={() => router.push('/adminpanel/reviews')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300"
              >
                Open Detailed Reviews
              </button>
            </div>
            <div className="bg-gray-800 rounded-lg p-6">
              <p className="text-gray-300">
                Click "Open Detailed Reviews" to access the comprehensive review management interface with detailed analytics, 
                customer information, device specs, IP addresses, and activity logs.
              </p>
            </div>
          </div>
        )}

        {/* Support Tab */}
        {activeTab === 'support' && (
          <SupportTab
            onLogAction={logAction}
          />
        )}


        {/* Products Tab */}
        {activeTab === 'products' && (
          <ProductsTab
            products={products}
            loadingProducts={loadingProducts}
            setProducts={setProducts}
            selectedProductForCustomization={selectedProductForCustomization}
            setSelectedProductForCustomization={setSelectedProductForCustomization}
            customizationForm={customizationForm}
            setCustomizationForm={setCustomizationForm}
            showProductModal={showProductModal}
            setShowProductModal={setShowProductModal}
            productMode={productMode}
            setProductMode={setProductMode}
            editingProductId={editingProductId}
            setEditingProductId={setEditingProductId}
            productForm={productForm}
            setProductForm={setProductForm}
            onLogAction={logAction}
            currentUser={currentUser}
            router={router}
            openCreateProduct={openCreateProduct}
            openEditProduct={openEditProduct}
            addImageField={addImageField}
            removeImageField={removeImageField}
            updateImageField={updateImageField}
            submitProduct={submitProduct}
            reloadProducts={reloadProducts}
          />
        )}



        {/* Teams Tab */}

        {activeTab === 'teams' && (

          <div className="space-y-6">

            <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-6">

              <div className="flex justify-between items-center mb-4">

                <h2 className="text-xl font-bold text-white flex items-center gap-2">

                  <UserIcon className="w-6 h-6" />

                  Teams Management

                </h2>

                <button

                  onClick={() => setShowCreateTeam(true)}

                  className="bg-blue-600/20 hover:bg-blue-600/30 border border-blue-600/30 text-blue-400 px-4 py-2 rounded-lg text-sm font-medium"

                >

                  Create Team

                </button>

              </div>



              {loadingTeams ? (

                <div className="text-center py-8">

                  <div className="text-white">Loading teams...</div>

                </div>

              ) : (

                <div className="space-y-6">

                  {teams.length === 0 ? (

                    <p className="text-gray-400">No teams found.</p>

                  ) : (

                    teams.map((team) => (

                      <div key={team.id} className="bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg p-6">

                        <div className="flex justify-between items-start mb-4">

                          <div>

                            <h3 className="text-xl font-bold text-white mb-2">{team.name}</h3>

                            <p className="text-gray-400 text-sm mb-2">{team.description}</p>

                            <div className="text-xs text-gray-500">

                              Players: {team.players?.length || 0}

                            </div>

                          </div>

                          <div className="flex gap-2">

                            <button

                              onClick={() => {

                                setSelectedTeam(team);

                                setShowAddPlayer(true);

                              }}

                              className="bg-green-600/20 hover:bg-green-600/30 border border-green-600/30 text-green-400 px-3 py-2 rounded-lg text-sm font-medium"

                            >

                              Add Player

                            </button>

                            <button

                              onClick={() => handleEditTeam(team)}

                              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium"

                              title="Edit Team & Reorder Players"

                            >

                              Edit Team

                            </button>

                            <button

                              onClick={() => handleDeleteTeam(team.id!, team.name)}

                              className="bg-red-600/20 hover:bg-red-600/30 border border-red-600/30 text-red-400 px-3 py-2 rounded-lg text-sm font-medium"

                              title="Delete Team"

                            >

                              <TrashIcon className="w-4 h-4" />

                            </button>

                          </div>

                        </div>



                        {/* Players List */}

                        <div className="space-y-3">

                          <h4 className="text-lg font-medium text-white">Players</h4>

                          {!team.players || team.players.length === 0 ? (

                            <p className="text-gray-400 text-sm">No players in this team yet.</p>

                          ) : (

                            team.players.map((player, index) => (

                              <div key={index} className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-4">

                                {editingPlayer?.teamId === team.id && editingPlayer?.playerIndex === index ? (

                                  // Edit Mode

                                  <div className="space-y-4">

                                    <div className="text-sm font-medium text-gray-300 mb-2">

                                      Editing: {editingPlayer.player.name}

                                    </div>



                                    {/* Basic Info */}

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

                                      <input

                                        type="text"

                                        value={editingPlayer.player.name}

                                        onChange={(e) => setEditingPlayer({

                                          ...editingPlayer,

                                          player: { ...editingPlayer.player, name: e.target.value }

                                        })}

                                        className="bg-[#0F0F0F] border border-[#2A2A2A] rounded px-3 py-2 text-white text-sm"

                                        placeholder="Player Name"

                                      />

                                      <input

                                        type="text"

                                        value={editingPlayer.player.role}

                                        onChange={(e) => setEditingPlayer({

                                          ...editingPlayer,

                                          player: { ...editingPlayer.player, role: e.target.value }

                                        })}

                                        className="bg-[#0F0F0F] border border-[#2A2A2A] rounded px-3 py-2 text-white text-sm"

                                        placeholder="Role"

                                      />

                                      <input

                                        type="text"

                                        value={editingPlayer.player.game}

                                        onChange={(e) => setEditingPlayer({

                                          ...editingPlayer,

                                          player: { ...editingPlayer.player, game: e.target.value }

                                        })}

                                        className="bg-[#0F0F0F] border border-[#2A2A2A] rounded px-3 py-2 text-white text-sm"

                                        placeholder="Game"

                                      />

                                    </div>



                                    {/* Image URL */}

                                    <div>

                                      <input

                                        type="text"

                                        value={editingPlayer.player.image}

                                        onChange={(e) => setEditingPlayer({

                                          ...editingPlayer,

                                          player: { ...editingPlayer.player, image: e.target.value }

                                        })}

                                        className="w-full bg-[#0F0F0F] border border-[#2A2A2A] rounded px-3 py-2 text-white text-sm"

                                        placeholder="Player Image URL"

                                      />

                                      {editingPlayer.player.image?.trim() && (

                                        <div className="mt-2 rounded-lg overflow-hidden border border-[#2A2A2A] bg-black/40">

                                          <div className="h-32 w-full flex items-center justify-center">

                                            <img

                                              src={processExternalImageUrl(editingPlayer.player.image)}

                                              alt="Preview"

                                              className="object-contain w-full h-full"

                                              onError={(e) => {

                                                const target = e.target as HTMLImageElement;

                                                target.style.display = 'none';

                                                const parent = target.parentElement;

                                                if (parent && !parent.querySelector('.error-message')) {

                                                  const errorDiv = document.createElement('div');

                                                  errorDiv.className = 'error-message text-red-400 text-sm text-center';

                                                  errorDiv.textContent = 'Failed to load image';

                                                  parent.appendChild(errorDiv);

                                                }

                                              }}

                                              onLoad={(e) => {

                                                const target = e.target as HTMLImageElement;

                                                const parent = target.parentElement;

                                                const errorMsg = parent?.querySelector('.error-message');

                                                if (errorMsg) {

                                                  errorMsg.remove();

                                                }

                                                target.style.display = 'block';

                                              }}

                                            />

                                          </div>

                                        </div>

                                      )}

                                    </div>



                                    {/* Achievements */}

                                    <div>

                                      <input

                                        type="text"

                                        value={editingPlayer.player.achievements?.join(', ') || ''}

                                        onChange={(e) => setEditingPlayer({

                                          ...editingPlayer,

                                          player: {

                                            ...editingPlayer.player,

                                            achievements: e.target.value.split(',').map(s => s.trim()).filter(Boolean)

                                          }

                                        })}

                                        className="w-full bg-[#0F0F0F] border border-[#2A2A2A] rounded px-3 py-2 text-white text-sm"

                                        placeholder="Achievements (comma separated) - e.g. FNCS Grand Finals, 2500+ Earnings, Top 10 Placement"

                                      />

                                    </div>



                                    {/* Social Links */}

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

                                      <input

                                        type="text"

                                        value={editingPlayer.player.socialLinks?.twitter || ''}

                                        onChange={(e) => setEditingPlayer({

                                          ...editingPlayer,

                                          player: {

                                            ...editingPlayer.player,

                                            socialLinks: {

                                              ...editingPlayer.player.socialLinks,

                                              twitter: e.target.value

                                            }

                                          }

                                        })}

                                        className="bg-[#0F0F0F] border border-[#2A2A2A] rounded px-3 py-2 text-white text-sm"

                                        placeholder="Twitter URL"

                                      />

                                      <input

                                        type="text"

                                        value={editingPlayer.player.socialLinks?.twitch || ''}

                                        onChange={(e) => setEditingPlayer({

                                          ...editingPlayer,

                                          player: {

                                            ...editingPlayer.player,

                                            socialLinks: {

                                              ...editingPlayer.player.socialLinks,

                                              twitch: e.target.value

                                            }

                                          }

                                        })}

                                        className="bg-[#0F0F0F] border border-[#2A2A2A] rounded px-3 py-2 text-white text-sm"

                                        placeholder="Twitch URL"

                                      />

                                      <input

                                        type="text"

                                        value={editingPlayer.player.socialLinks?.youtube || ''}

                                        onChange={(e) => setEditingPlayer({

                                          ...editingPlayer,

                                          player: {

                                            ...editingPlayer.player,

                                            socialLinks: {

                                              ...editingPlayer.player.socialLinks,

                                              youtube: e.target.value

                                            }

                                          }

                                        })}

                                        className="bg-[#0F0F0F] border border-[#2A2A2A] rounded px-3 py-2 text-white text-sm"

                                        placeholder="YouTube URL"

                                      />

                                    </div>



                                    {/* Instagram Link */}

                                    <div>

                                      <input

                                        type="text"

                                        value={editingPlayer.player.socialLinks?.instagram || ''}

                                        onChange={(e) => setEditingPlayer({

                                          ...editingPlayer,

                                          player: {

                                            ...editingPlayer.player,

                                            socialLinks: {

                                              ...editingPlayer.player.socialLinks,

                                              instagram: e.target.value

                                            }

                                          }

                                        })}

                                        className="w-full bg-[#0F0F0F] border border-[#2A2A2A] rounded px-3 py-2 text-white text-sm"

                                        placeholder="Instagram URL"

                                      />

                                    </div>

                                    <div className="flex gap-3 pt-2 border-t border-[#2A2A2A]">

                                      <button

                                        onClick={() => handleEditPlayer(team.id!, index, editingPlayer.player)}

                                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm font-medium"

                                      >

                                        Save Changes

                                      </button>

                                      <button

                                        onClick={() => setEditingPlayer(null)}

                                        className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded text-sm font-medium"

                                      >

                                        Cancel

                                      </button>

                                    </div>

                                  </div>

                                ) : (

                                  // View Mode

                                  <div className="flex justify-between items-start">

                                    <div className="flex-1">

                                      <div className="flex items-center gap-3 mb-2">

                                        <span className="bg-gray-600/20 text-gray-400 px-2 py-1 rounded text-xs font-mono">

                                          #{index + 1}

                                        </span>

                                        <h5 className="text-white font-medium">{player.name}</h5>

                                        <span className="bg-blue-600/20 text-blue-400 px-2 py-1 rounded text-xs">

                                          {player.role}

                                        </span>

                                      </div>

                                      <div className="text-sm text-gray-400 space-y-1">

                                        <div>Game: {player.game}</div>

                                        {player.achievements && player.achievements.length > 0 && (

                                          <div>Achievements: {player.achievements.slice(0, 2).join(', ')}{player.achievements.length > 2 ? '...' : ''}</div>

                                        )}

                                        {(player.socialLinks?.twitter || player.socialLinks?.twitch || player.socialLinks?.youtube || player.socialLinks?.instagram) && (

                                          <div className="flex gap-2 mt-1">

                                            {player.socialLinks?.twitter && (

                                              <a href={player.socialLinks.twitter} target="_blank" rel="noopener noreferrer"

                                                className="text-blue-400 hover:text-blue-300 text-xs">Twitter</a>

                                            )}

                                            {player.socialLinks?.twitch && (

                                              <a href={player.socialLinks.twitch} target="_blank" rel="noopener noreferrer"

                                                className="text-purple-400 hover:text-purple-300 text-xs">Twitch</a>

                                            )}

                                            {player.socialLinks?.youtube && (

                                              <a href={player.socialLinks.youtube} target="_blank" rel="noopener noreferrer"

                                                className="text-red-400 hover:text-red-300 text-xs">YouTube</a>

                                            )}

                                            {player.socialLinks?.instagram && (

                                              <a href={player.socialLinks.instagram} target="_blank" rel="noopener noreferrer"

                                                className="text-pink-400 hover:text-pink-300 text-xs">Instagram</a>

                                            )}

                                          </div>

                                        )}

                                      </div>

                                    </div>

                                    <div className="flex gap-1 items-center">

                                      {/* Reorder buttons */}

                                      <div className="flex flex-col">

                                        <button

                                          onClick={() => handleMovePlayer(team.id!, index, 'up')}

                                          disabled={index === 0}

                                          className="text-gray-400 hover:text-white p-1 disabled:opacity-30 disabled:cursor-not-allowed"

                                          title="Move Up"

                                        >

                                          <ChevronUpIcon className="w-3 h-3" />

                                        </button>

                                        <button

                                          onClick={() => handleMovePlayer(team.id!, index, 'down')}

                                          disabled={index === (team.players?.length || 0) - 1}

                                          className="text-gray-400 hover:text-white p-1 disabled:opacity-30 disabled:cursor-not-allowed"

                                          title="Move Down"

                                        >

                                          <ChevronDownIcon className="w-3 h-3" />

                                        </button>

                                      </div>



                                      {/* Action buttons */}

                                      <button

                                        onClick={() => {

                                          console.log('Edit button clicked for player:', player.name);

                                          setEditingPlayer({

                                            teamId: team.id!,

                                            playerIndex: index,

                                            player: { ...player }

                                          });

                                        }}

                                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm font-medium"

                                        title="Edit Player"

                                      >

                                        Edit

                                      </button>

                                      <button

                                        onClick={() => handleDeletePlayer(team.id!, index)}

                                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm font-medium"

                                        title="Remove Player"

                                      >

                                        Remove

                                      </button>

                                    </div>

                                  </div>

                                )}

                              </div>

                            ))

                          )}

                        </div>

                      </div>

                    ))

                  )}

                </div>

              )}

            </div>

          </div>

        )}

        {/* Ambassadors Tab */}

        {activeTab === 'ambassadors' && (

          <AmbassadorsTab
            ambassadors={ambassadors}
            loadingAmbassadors={loadingAmbassadors}
            setLoadingAmbassadors={setLoadingAmbassadors}
            setAmbassadors={setAmbassadors}
            onLogAction={logAction}
          />

        )}





        {/* Add Player Modal */}

        {showAddPlayer && selectedTeam && (

          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">

            <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">

              <div className="p-6">

                <div className="flex justify-between items-center mb-6">

                  <h3 className="text-xl font-bold text-white">

                    Add Player to {selectedTeam.name}

                  </h3>

                  <button

                    onClick={() => {

                      setShowAddPlayer(false);

                      setSelectedTeam(null);

                      setNewPlayer({

                        name: '',

                        role: '',

                        image: '',

                        game: '',

                        achievements: [],

                        socialLinks: {}

                      });

                    }}

                    className="text-gray-400 hover:text-white"

                  >

                    <XMarkIcon className="w-6 h-6" />

                  </button>

                </div>



                <div className="space-y-4">

                  <div>

                    <label className="block text-sm font-medium text-gray-300 mb-2">

                      Player Name *

                    </label>

                    <input

                      type="text"

                      value={newPlayer.name}

                      onChange={(e) => setNewPlayer({ ...newPlayer, name: e.target.value })}

                      className="w-full bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg px-3 py-2 text-white"

                      placeholder="Enter player name"

                    />

                  </div>



                  <div>

                    <label className="block text-sm font-medium text-gray-300 mb-2">

                      Role *

                    </label>

                    <input

                      type="text"

                      value={newPlayer.role}

                      onChange={(e) => setNewPlayer({ ...newPlayer, role: e.target.value })}

                      className="w-full bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg px-3 py-2 text-white"

                      placeholder="e.g. Entry Fragger, IGL, AWPer"

                    />

                  </div>



                  <div>

                    <label className="block text-sm font-medium text-gray-300 mb-2">

                      Game *

                    </label>

                    <input

                      type="text"

                      value={newPlayer.game}

                      onChange={(e) => setNewPlayer({ ...newPlayer, game: e.target.value })}

                      className="w-full bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg px-3 py-2 text-white"

                      placeholder="e.g. Fortnite, CS2, Valorant"

                    />

                  </div>



                  <div>

                    <label className="block text-sm font-medium text-gray-300 mb-2">

                      Image URL

                    </label>

                    <input

                      type="text"

                      value={newPlayer.image}

                      onChange={(e) => setNewPlayer({ ...newPlayer, image: e.target.value })}

                      className="w-full bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg px-3 py-2 text-white"

                      placeholder="Player image URL (Discord, Imgur, etc.)"

                    />

                    <p className="text-xs text-gray-500 mt-1">

                      💡 Tip: For Discord images, right-click → "Copy image address" for best results

                    </p>

                    {newPlayer.image?.trim() && (

                      <div className="mt-3 rounded-lg overflow-hidden border border-[#2A2A2A] bg-black/40">

                        <div className="h-40 w-full flex items-center justify-center">

                          <img

                            src={processExternalImageUrl(newPlayer.image)}

                            alt="Preview"

                            className="object-contain w-full h-full"

                            crossOrigin="anonymous"

                            referrerPolicy="no-referrer"

                            onError={(e) => {

                              const target = e.target as HTMLImageElement;

                              target.style.display = 'none';

                              const parent = target.parentElement;

                              if (parent && !parent.querySelector('.error-message')) {

                                const errorDiv = document.createElement('div');

                                errorDiv.className = 'error-message text-red-400 text-sm text-center p-4';

                                if (newPlayer.image?.includes('discord')) {

                                  errorDiv.innerHTML = `

                                  <div>❌ Discord image failed to load</div>

                                  <div class="text-xs mt-2">Try these alternatives:</div>

                                  <div class="text-xs">• Upload to <a href="https://imgur.com" target="_blank" class="text-blue-400 underline">Imgur</a></div>

                                  <div class="text-xs">• Use a different image host</div>

                                  <div class="text-xs">• Right-click → "Copy image address" in Discord</div>

                                `;

                                } else {

                                  errorDiv.innerHTML = `

                                  <div>❌ External image failed to load</div>

                                  <div class="text-xs mt-2">Suggestions:</div>

                                  <div class="text-xs">• Check if URL is accessible</div>

                                  <div class="text-xs">• Try uploading to <a href="https://imgur.com" target="_blank" class="text-blue-400 underline">Imgur</a></div>

                                  <div class="text-xs">• Use a direct image link</div>

                                `;

                                }

                                parent.appendChild(errorDiv);

                              }

                            }}

                            onLoad={(e) => {

                              const target = e.target as HTMLImageElement;

                              const parent = target.parentElement;

                              const errorMsg = parent?.querySelector('.error-message');

                              if (errorMsg) {

                                errorMsg.remove();

                              }

                              target.style.display = 'block';

                            }}

                          />

                        </div>

                      </div>

                    )}

                  </div>



                  <div>

                    <label className="block text-sm font-medium text-gray-300 mb-2">

                      Achievements (comma separated)

                    </label>

                    <input

                      type="text"

                      value={newPlayer.achievements?.join(', ') || ''}

                      onChange={(e) => setNewPlayer({

                        ...newPlayer,

                        achievements: e.target.value.split(',').map(s => s.trim()).filter(Boolean)

                      })}

                      className="w-full bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg px-3 py-2 text-white"

                      placeholder="e.g. FNCS Grand Finals, 2500+ Earnings, Top 10 Placement"

                    />

                  </div>



                  <div className="grid grid-cols-2 gap-3">

                    <div>

                      <label className="block text-sm font-medium text-gray-300 mb-2">

                        Twitter URL

                      </label>

                      <input

                        type="text"

                        value={newPlayer.socialLinks?.twitter || ''}

                        onChange={(e) => setNewPlayer({

                          ...newPlayer,

                          socialLinks: { ...newPlayer.socialLinks, twitter: e.target.value }

                        })}

                        className="w-full bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg px-3 py-2 text-white"

                        placeholder="Twitter profile URL"

                      />

                    </div>



                    <div>

                      <label className="block text-sm font-medium text-gray-300 mb-2">

                        Twitch URL

                      </label>

                      <input

                        type="text"

                        value={newPlayer.socialLinks?.twitch || ''}

                        onChange={(e) => setNewPlayer({

                          ...newPlayer,

                          socialLinks: { ...newPlayer.socialLinks, twitch: e.target.value }

                        })}

                        className="w-full bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg px-3 py-2 text-white"

                        placeholder="Twitch channel URL"

                      />

                    </div>



                    <div>

                      <label className="block text-sm font-medium text-gray-300 mb-2">

                        YouTube URL

                      </label>

                      <input

                        type="text"

                        value={newPlayer.socialLinks?.youtube || ''}

                        onChange={(e) => setNewPlayer({

                          ...newPlayer,

                          socialLinks: { ...newPlayer.socialLinks, youtube: e.target.value }

                        })}

                        className="w-full bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg px-3 py-2 text-white"

                        placeholder="YouTube channel URL"

                      />

                    </div>

                  </div>



                  <div>

                    <label className="block text-sm font-medium text-gray-300 mb-2">

                      Instagram URL

                    </label>

                    <input

                      type="text"

                      value={newPlayer.socialLinks?.instagram || ''}

                      onChange={(e) => setNewPlayer({

                        ...newPlayer,

                        socialLinks: { ...newPlayer.socialLinks, instagram: e.target.value }

                      })}

                      className="w-full bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg px-3 py-2 text-white"

                      placeholder="Instagram profile URL"

                    />

                  </div>



                  <div className="flex gap-3 pt-4">

                    <button

                      onClick={() => {

                        setShowAddPlayer(false);

                        setSelectedTeam(null);

                        setNewPlayer({

                          name: '',

                          role: '',

                          image: '',

                          game: '',

                          achievements: [],

                          socialLinks: {}

                        });

                      }}

                      className="flex-1 bg-[#2A2A2A] hover:bg-[#3A3A3A] text-white font-medium py-2 px-4 rounded-lg"

                    >

                      Cancel

                    </button>

                    <button

                      onClick={() => handleAddPlayer(selectedTeam.id!)}

                      disabled={loadingTeams}

                      className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg disabled:opacity-50"

                    >

                      {loadingTeams ? 'Adding...' : 'Add Player'}

                    </button>

                  </div>

                </div>

              </div>

            </div>

          </div>

        )}



        {/* Create Team Modal */}

        {showCreateTeam && (

          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">

            <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl max-w-md w-full">

              <div className="p-6">

                <div className="flex justify-between items-center mb-6">

                  <h3 className="text-xl font-bold text-white">Create New Team</h3>

                  <button

                    onClick={() => {

                      setShowCreateTeam(false);

                      setNewTeam({

                        name: '',

                        image: '',

                        description: '',

                        achievements: [],

                        players: []

                      });

                    }}

                    className="text-gray-400 hover:text-white"

                  >

                    <XMarkIcon className="w-6 h-6" />

                  </button>

                </div>



                <div className="space-y-4">

                  <div>

                    <label className="block text-sm font-medium text-gray-300 mb-2">

                      Team Name *

                    </label>

                    <input

                      type="text"

                      value={newTeam.name}

                      onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}

                      className="w-full bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg px-3 py-2 text-white"

                      placeholder="Enter team name"

                    />

                  </div>



                  <div>

                    <label className="block text-sm font-medium text-gray-300 mb-2">

                      Description *

                    </label>

                    <textarea

                      value={newTeam.description}

                      onChange={(e) => setNewTeam({ ...newTeam, description: e.target.value })}

                      className="w-full bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg px-3 py-2 text-white h-20 resize-none"

                      placeholder="Enter team description"

                    />

                  </div>



                  <div>

                    <label className="block text-sm font-medium text-gray-300 mb-2">

                      Team Logo URL

                    </label>

                    <input

                      type="text"

                      value={newTeam.image}

                      onChange={(e) => setNewTeam({ ...newTeam, image: e.target.value })}

                      className="w-full bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg px-3 py-2 text-white"

                      placeholder="Team logo image URL"

                    />

                  </div>



                  <div className="flex gap-3 pt-4">

                    <button

                      onClick={() => {

                        setShowCreateTeam(false);

                        setNewTeam({

                          name: '',

                          image: '',

                          description: '',

                          achievements: [],

                          players: []

                        });

                      }}

                      className="flex-1 bg-[#2A2A2A] hover:bg-[#3A3A3A] text-white font-medium py-2 px-4 rounded-lg"

                    >

                      Cancel

                    </button>

                    <button

                      onClick={handleCreateTeam}

                      disabled={loadingTeams}

                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg disabled:opacity-50"

                    >

                      {loadingTeams ? 'Creating...' : 'Create Team'}

                    </button>

                  </div>

                </div>

              </div>

            </div>

          </div>

        )}



        {/* Edit Team Modal */}

        {showEditTeam && editingTeam && (

          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">

            <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">

              <div className="p-6">

                <div className="flex justify-between items-center mb-6">

                  <h3 className="text-xl font-bold text-white">Edit Team: {editingTeam.name}</h3>

                  <button

                    onClick={() => {

                      setShowEditTeam(false);

                      setEditingTeam(null);

                    }}

                    className="text-gray-400 hover:text-white"

                  >

                    <XMarkIcon className="w-6 h-6" />

                  </button>

                </div>



                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                  {/* Team Details */}

                  <div className="space-y-4">

                    <h4 className="text-lg font-medium text-white">Team Details</h4>



                    <div>

                      <label className="block text-sm font-medium text-gray-300 mb-2">

                        Team Name *

                      </label>

                      <input

                        type="text"

                        value={editingTeam.name}

                        onChange={(e) => setEditingTeam({ ...editingTeam, name: e.target.value })}

                        className="w-full bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg px-3 py-2 text-white"

                      />

                    </div>



                    <div>

                      <label className="block text-sm font-medium text-gray-300 mb-2">

                        Description *

                      </label>

                      <textarea

                        value={editingTeam.description}

                        onChange={(e) => setEditingTeam({ ...editingTeam, description: e.target.value })}

                        className="w-full bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg px-3 py-2 text-white h-20 resize-none"

                      />

                    </div>



                    <div>

                      <label className="block text-sm font-medium text-gray-300 mb-2">

                        Team Logo URL

                      </label>

                      <input

                        type="text"

                        value={editingTeam.image}

                        onChange={(e) => setEditingTeam({ ...editingTeam, image: e.target.value })}

                        className="w-full bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg px-3 py-2 text-white"

                      />

                    </div>

                  </div>



                  {/* Players Management */}

                  <div className="space-y-4">

                    <h4 className="text-lg font-medium text-white">Players Management</h4>



                    <div className="space-y-3 max-h-96 overflow-y-auto">

                      {editingTeam.players.length === 0 ? (

                        <p className="text-gray-400 text-sm">No players in this team yet.</p>

                      ) : (

                        editingTeam.players.map((player, index) => (

                          <div key={index} className="bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg p-3">

                            <div className="flex items-center justify-between">

                              <div className="flex-1">

                                <div className="flex items-center gap-2 mb-1">

                                  <span className="text-white font-medium">{player.name}</span>

                                  <span className="bg-blue-600/20 text-blue-400 px-2 py-1 rounded text-xs">

                                    {player.role}

                                  </span>

                                </div>

                                <div className="text-xs text-gray-400">

                                  Game: {player.game}

                                </div>

                              </div>



                              <div className="flex items-center gap-1">

                                {/* Move Up */}

                                <button

                                  onClick={() => movePlayer('up', index)}

                                  disabled={index === 0}

                                  className="text-gray-400 hover:text-white p-1 disabled:opacity-30 disabled:cursor-not-allowed"

                                  title="Move Up"

                                >

                                  <ChevronUpIcon className="w-4 h-4" />

                                </button>



                                {/* Move Down */}

                                <button

                                  onClick={() => movePlayer('down', index)}

                                  disabled={index === editingTeam.players.length - 1}

                                  className="text-gray-400 hover:text-white p-1 disabled:opacity-30 disabled:cursor-not-allowed"

                                  title="Move Down"

                                >

                                  <ChevronDownIcon className="w-4 h-4" />

                                </button>



                                {/* Remove Player */}

                                <button

                                  onClick={() => removePlayerFromTeam(index)}

                                  className="text-red-400 hover:text-red-300 p-1 ml-2"

                                  title="Remove Player"

                                >

                                  <TrashIcon className="w-4 h-4" />

                                </button>

                              </div>

                            </div>

                          </div>

                        ))

                      )}

                    </div>



                    <div className="text-xs text-gray-500">

                      Use the up/down arrows to reorder players. The first player will appear first on the team page.

                    </div>

                  </div>

                </div>



                <div className="flex gap-3 pt-6 border-t border-[#2A2A2A] mt-6">

                  <button

                    onClick={() => {

                      setShowEditTeam(false);

                      setEditingTeam(null);

                    }}

                    className="flex-1 bg-[#2A2A2A] hover:bg-[#3A3A3A] text-white font-medium py-2 px-4 rounded-lg"

                  >

                    Cancel

                  </button>

                  <button

                    onClick={handleUpdateTeam}

                    disabled={loadingTeams}

                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg disabled:opacity-50"

                  >

                    {loadingTeams ? 'Updating...' : 'Update Team'}

                  </button>

                </div>

              </div>

            </div>

          </div>

        )}



        {/* Order Details Modal */}

        {showOrderDetails && selectedOrder && (

          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">

            <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">

              <div className="p-6">

                <div className="flex justify-between items-center mb-6">

                  <h3 className="text-xl font-bold text-white">

                    Order {formatOrderNumber(selectedOrder.id)}

                  </h3>

                  <button

                    onClick={() => setShowOrderDetails(false)}

                    className="text-gray-400 hover:text-white"

                  >

                    <XMarkIcon className="w-6 h-6" />

                  </button>

                </div>



                <div className="space-y-6">

                  {/* Customer Info */}

                  <div>

                    <h4 className="text-lg font-medium text-white mb-3">Customer Information</h4>

                    <div className="bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg p-4 space-y-2">

                      <p className="text-gray-300"><span className="text-gray-400">Name:</span> {selectedOrder.customerInfo.name}</p>

                      <p className="text-gray-300"><span className="text-gray-400">Email:</span> {selectedOrder.customerInfo.email}</p>

                      <p className="text-gray-300"><span className="text-gray-400">Phone:</span> {selectedOrder.customerInfo.phone}</p>

                      <p className="text-gray-300"><span className="text-gray-400">Address:</span> {selectedOrder.customerInfo.address}</p>

                      <p className="text-gray-300"><span className="text-gray-400">Zip Code:</span> {selectedOrder.customerInfo.zipCode}</p>

                      <p className="text-gray-300"><span className="text-gray-400">Country:</span> {selectedOrder.customerInfo.country}</p>

                    </div>

                  </div>



                  {/* Order Items */}

                  <div>

                    <h4 className="text-lg font-medium text-white mb-3">Order Items</h4>

                    <div className="space-y-3">

                      {selectedOrder.items.map((item, index) => (

                        <div key={index} className="bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg p-4 flex items-center gap-4">

                          <div className="relative w-16 h-16 rounded-lg overflow-hidden">

                            <Image

                              src={item.image}

                              alt={item.name}

                              fill

                              className="object-cover"

                            />

                          </div>

                          <div className="flex-1">

                            <h5 className="text-white font-medium">{item.name}</h5>

                            <p className="text-gray-400 text-sm">Quantity: {item.quantity}</p>

                          </div>

                          <div className="text-right">

                            <p className="text-white font-medium">${(item.price * item.quantity).toFixed(2)}</p>

                            <p className="text-gray-400 text-sm">${item.price.toFixed(2)} each</p>

                          </div>

                        </div>

                      ))}

                    </div>

                  </div>



                  {/* Order Summary */}

                  <div className="bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg p-4">

                    <div className="flex justify-between items-center text-lg font-bold text-white">

                      <span>Total:</span>

                      <span>${selectedOrder.total.toFixed(2)}</span>

                    </div>

                    <div className="flex justify-between items-center text-sm text-gray-400 mt-2">

                      <span>Status:</span>

                      <span className={`px-2 py-1 rounded ${getStatusColor(selectedOrder.status)}`}>

                        {selectedOrder.status}

                      </span>

                    </div>

                    <div className="flex justify-between items-center text-sm text-gray-400 mt-1">

                      <span>Order Date:</span>

                      <span>{new Date(selectedOrder.createdAt).toLocaleDateString()}</span>

                    </div>

                  </div>

                </div>

              </div>

            </div>

          </div>

        )}

        {/* Create/Edit Ambassador Modal */}

        {showCreateAmbassador && (

          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">

            <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">

              <div className="p-6">

                <div className="flex justify-between items-center mb-6">

                  <h3 className="text-xl font-bold text-white">

                    {editingAmbassador ? 'Edit Ambassador' : 'Add Ambassador'}

                  </h3>

                  <button

                    onClick={() => setShowCreateAmbassador(false)}

                    className="text-gray-400 hover:text-white"

                  >

                    <XMarkIcon className="w-6 h-6" />

                  </button>

                </div>



                <div className="space-y-4">

                  <div>

                    <label className="block text-sm font-medium text-gray-300 mb-2">Name *</label>

                    <input

                      type="text"

                      value={ambassadorForm.name}

                      onChange={(e) => setAmbassadorForm({ ...ambassadorForm, name: e.target.value })}

                      className="w-full bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg px-3 py-2 text-white"

                    />

                  </div>



                  <div>

                    <label className="block text-sm font-medium text-gray-300 mb-2">Role</label>

                    <input

                      type="text"

                      value={ambassadorForm.role}

                      onChange={(e) => setAmbassadorForm({ ...ambassadorForm, role: e.target.value })}

                      className="w-full bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg px-3 py-2 text-white"

                    />

                  </div>



                  <div>

                    <label className="block text-sm font-medium text-gray-300 mb-2">Game</label>

                    <input

                      type="text"

                      value={ambassadorForm.game}

                      onChange={(e) => setAmbassadorForm({ ...ambassadorForm, game: e.target.value })}

                      className="w-full bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg px-3 py-2 text-white"

                    />

                  </div>



                  <div>

                    <label className="block text-sm font-medium text-gray-300 mb-2">Image URL</label>

                    <input

                      type="text"

                      value={ambassadorForm.image}

                      onChange={(e) => setAmbassadorForm({ ...ambassadorForm, image: e.target.value })}

                      className="w-full bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg px-3 py-2 text-white"

                      placeholder="Ambassador image URL (Discord, Imgur, etc.)"

                    />

                    <p className="text-xs text-gray-500 mt-1">

                      💡 Tip: For Discord images, right-click → "Copy image address" for best results

                    </p>

                    {ambassadorForm.image?.trim() && (

                      <div className="mt-3 rounded-lg overflow-hidden border border-[#2A2A2A] bg-black/40">

                        <div className="h-40 w-full flex items-center justify-center">

                          <img

                            src={processExternalImageUrl(ambassadorForm.image)}

                            alt="Preview"

                            className="object-contain w-full h-full"

                            crossOrigin="anonymous"

                            referrerPolicy="no-referrer"

                            onError={(e) => {

                              const target = e.target as HTMLImageElement;

                              target.style.display = 'none';

                              const parent = target.parentElement;

                              if (parent && !parent.querySelector('.error-message')) {

                                const errorDiv = document.createElement('div');

                                errorDiv.className = 'error-message text-red-400 text-sm text-center p-4';

                                if (ambassadorForm.image?.includes('discord')) {

                                  errorDiv.innerHTML = `

                                  <div>❌ Discord image failed to load</div>

                                  <div class="text-xs mt-2">Try these alternatives:</div>

                                  <div class="text-xs">• Upload to <a href="https://imgur.com" target="_blank" class="text-blue-400 underline">Imgur</a></div>

                                  <div class="text-xs">• Use a different image host</div>

                                  <div class="text-xs">• Right-click → "Copy image address" in Discord</div>

                                `;

                                } else {

                                  errorDiv.innerHTML = `

                                  <div>❌ External image failed to load</div>

                                  <div class="text-xs mt-2">Suggestions:</div>

                                  <div class="text-xs">• Check if URL is accessible</div>

                                  <div class="text-xs">• Try uploading to <a href="https://imgur.com" target="_blank" class="text-blue-400 underline">Imgur</a></div>

                                  <div class="text-xs">• Use a direct image link</div>

                                `;

                                }

                                parent.appendChild(errorDiv);

                              }

                            }}

                            onLoad={(e) => {

                              const target = e.target as HTMLImageElement;

                              const parent = target.parentElement;

                              const errorMsg = parent?.querySelector('.error-message');

                              if (errorMsg) {

                                errorMsg.remove();

                              }

                              target.style.display = 'block';

                            }}

                          />

                        </div>

                      </div>

                    )}

                  </div>



                  <div>

                    <label className="block text-sm font-medium text-gray-300 mb-2">Achievements (comma separated)</label>

                    <input

                      type="text"

                      value={ambassadorForm.achievements?.join(', ') || ''}

                      onChange={(e) => setAmbassadorForm({

                        ...ambassadorForm,

                        achievements: e.target.value.split(',').map(s => s.trim()).filter(Boolean)

                      })}

                      className="w-full bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg px-3 py-2 text-white"

                    />

                  </div>



                  <div className="grid grid-cols-2 gap-3">

                    <div>

                      <label className="block text-sm font-medium text-gray-300 mb-2">Twitter</label>

                      <input

                        type="text"

                        value={ambassadorForm.socialLinks?.twitter || ''}

                        onChange={(e) => setAmbassadorForm({

                          ...ambassadorForm,

                          socialLinks: { ...ambassadorForm.socialLinks, twitter: e.target.value }

                        })}

                        className="w-full bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg px-3 py-2 text-white"

                      />

                    </div>

                    <div>

                      <label className="block text-sm font-medium text-gray-300 mb-2">Twitch</label>

                      <input

                        type="text"

                        value={ambassadorForm.socialLinks?.twitch || ''}

                        onChange={(e) => setAmbassadorForm({

                          ...ambassadorForm,

                          socialLinks: { ...ambassadorForm.socialLinks, twitch: e.target.value }

                        })}

                        className="w-full bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg px-3 py-2 text-white"

                      />

                    </div>

                  </div>



                  <div>

                    <label className="block text-sm font-medium text-gray-300 mb-2">Instagram</label>

                    <input

                      type="text"

                      value={ambassadorForm.socialLinks?.instagram || ''}

                      onChange={(e) => setAmbassadorForm({

                        ...ambassadorForm,

                        socialLinks: { ...ambassadorForm.socialLinks, instagram: e.target.value }

                      })}

                      className="w-full bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg px-3 py-2 text-white"

                    />

                  </div>



                  <div className="flex gap-3 pt-4">

                    <button

                      onClick={() => setShowCreateAmbassador(false)}

                      className="flex-1 bg-[#2A2A2A] hover:bg-[#3A3A3A] text-white font-medium py-2 px-4 rounded-lg"

                    >

                      Cancel

                    </button>

                    <button

                      onClick={editingAmbassador ? handleUpdateAmbassador : handleCreateAmbassador}

                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg"

                    >

                      {editingAmbassador ? 'Update' : 'Create'}

                    </button>

                  </div>

                </div>

              </div>

            </div>

          </div>

        )}

        

        {/* Product Customization Modal */}

        {selectedProductForCustomization && (

          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">

            <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">

              <div className="p-6">

                <div className="flex justify-between items-center mb-6">

                  <h3 className="text-xl font-bold text-white">

                    Customize: {selectedProductForCustomization.name}

                  </h3>

                  <button

                    onClick={() => setSelectedProductForCustomization(null)}

                    className="text-gray-400 hover:text-white"

                  >

                    <XMarkIcon className="w-6 h-6" />

                  </button>

                </div>



                <div className="space-y-6">

                  {/* Enable/Disable Options */}

                  {/* Configuration Toggles */}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">

                    <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-4">

                      <label className="flex items-center gap-3 cursor-pointer">

                        <input

                          type="checkbox"

                          checked={customizationForm.hasCustomFields}

                          onChange={(e) => setCustomizationForm(prev => ({

                            ...prev,

                            hasCustomFields: e.target.checked

                          }))}

                          className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500"

                        />

                        <span className="text-white font-medium">Enable Custom Fields</span>

                      </label>

                      <p className="text-gray-400 text-xs mt-2">

                        Allow customers to enter custom information (e.g., name on jersey)

                      </p>

                    </div>



                    <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-4">

                      <label className="flex items-center gap-3 cursor-pointer">

                        <input

                          type="checkbox"

                          checked={customizationForm.hasSizes}

                          onChange={(e) => setCustomizationForm(prev => ({

                            ...prev,

                            hasSizes: e.target.checked

                          }))}

                          className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500"

                        />

                        <span className="text-white font-medium">Enable Size Selection</span>

                      </label>

                      <p className="text-gray-400 text-xs mt-2">

                        Allow customers to select sizes with optional price modifiers

                      </p>

                    </div>



                    <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-4">

                      <label className="flex items-center gap-3 cursor-pointer">

                        <input

                          type="checkbox"

                          checked={customizationForm.hasSizeChart}

                          onChange={(e) => setCustomizationForm(prev => ({

                            ...prev,

                            hasSizeChart: e.target.checked

                          }))}

                          className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500"

                        />

                        <span className="text-white font-medium">Enable Size Chart</span>

                      </label>

                      <p className="text-gray-400 text-xs mt-2">

                        Show a size guide link on the product page

                      </p>

                    </div>

                  </div>



                  {/* Custom Fields Configuration */}

                  {customizationForm.hasCustomFields && (

                    <div className="bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg p-4">

                      <div className="flex justify-between items-center mb-4">

                        <h4 className="text-lg font-semibold text-white">Custom Fields</h4>

                        <button

                          onClick={() => setCustomizationForm(prev => ({

                            ...prev,

                            customFields: [...prev.customFields, {

                              id: `field_${Date.now()}`,

                              label: '',

                              type: 'text',

                              required: false

                            }]

                          }))}

                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"

                        >

                          Add Field

                        </button>

                      </div>



                      <div className="space-y-4">

                        {customizationForm.customFields.map((field, index) => (

                          <div key={field.id} className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-4">

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">

                              <div>

                                <label className="block text-sm font-medium text-gray-300 mb-1">Field Label</label>

                                <input

                                  type="text"

                                  value={field.label}

                                  onChange={(e) => {

                                    const newFields = [...customizationForm.customFields];

                                    newFields[index].label = e.target.value;

                                    setCustomizationForm(prev => ({ ...prev, customFields: newFields }));

                                  }}

                                  className="w-full bg-[#0F0F0F] border border-[#2A2A2A] rounded px-3 py-2 text-white text-sm"

                                  placeholder="e.g., Name on Jersey"

                                />

                              </div>



                              <div>

                                <label className="block text-sm font-medium text-gray-300 mb-1">Field Type</label>

                                <select

                                  value={field.type}

                                  onChange={(e) => {

                                    const newFields = [...customizationForm.customFields];

                                    newFields[index].type = e.target.value as 'text' | 'number' | 'select';

                                    setCustomizationForm(prev => ({ ...prev, customFields: newFields }));

                                  }}

                                  className="w-full bg-[#0F0F0F] border border-[#2A2A2A] rounded px-3 py-2 text-white text-sm"

                                >

                                  <option value="text">Text</option>

                                  <option value="number">Number</option>

                                  <option value="select">Select</option>

                                </select>

                              </div>



                              <div>

                                <label className="block text-sm font-medium text-gray-300 mb-1">Required</label>

                                <input

                                  type="checkbox"

                                  checked={field.required}

                                  onChange={(e) => {

                                    const newFields = [...customizationForm.customFields];

                                    newFields[index].required = e.target.checked;

                                    setCustomizationForm(prev => ({ ...prev, customFields: newFields }));

                                  }}

                                  className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500"

                                />

                              </div>



                              <div>

                                <label className="block text-sm font-medium text-gray-300 mb-1">Actions</label>

                                <button

                                  onClick={() => setCustomizationForm(prev => ({

                                    ...prev,

                                    customFields: prev.customFields.filter((_, i) => i !== index)

                                  }))}

                                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"

                                >

                                  Remove

                                </button>

                              </div>

                            </div>



                            {/* Additional options based on field type */}

                            {field.type === 'text' && (

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                                <div>

                                  <label className="block text-sm font-medium text-gray-300 mb-1">Placeholder</label>

                                  <input

                                    type="text"

                                    value={field.placeholder || ''}

                                    onChange={(e) => {

                                      const newFields = [...customizationForm.customFields];

                                      newFields[index].placeholder = e.target.value;

                                      setCustomizationForm(prev => ({ ...prev, customFields: newFields }));

                                    }}

                                    className="w-full bg-[#0F0F0F] border border-[#2A2A2A] rounded px-3 py-2 text-white text-sm"

                                    placeholder="Optional placeholder text"

                                  />

                                </div>

                                <div>

                                  <label className="block text-sm font-medium text-gray-300 mb-1">Max Length</label>

                                  <input

                                    type="number"

                                    value={field.maxLength || ''}

                                    onChange={(e) => {

                                      const newFields = [...customizationForm.customFields];

                                      newFields[index].maxLength = e.target.value ? parseInt(e.target.value) : undefined;

                                      setCustomizationForm(prev => ({ ...prev, customFields: newFields }));

                                    }}

                                    className="w-full bg-[#0F0F0F] border border-[#2A2A2A] rounded px-3 py-2 text-white text-sm"

                                    placeholder="Optional max length"

                                  />

                                </div>

                              </div>

                            )}



                            {field.type === 'number' && (

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                                <div>

                                  <label className="block text-sm font-medium text-gray-300 mb-1">Min Value</label>

                                  <input

                                    type="number"

                                    value={field.validation?.min || ''}

                                    onChange={(e) => {

                                      const newFields = [...customizationForm.customFields];

                                      newFields[index].validation = {

                                        ...newFields[index].validation,

                                        min: e.target.value ? parseInt(e.target.value) : undefined

                                      };

                                      setCustomizationForm(prev => ({ ...prev, customFields: newFields }));

                                    }}

                                    className="w-full bg-[#0F0F0F] border border-[#2A2A2A] rounded px-3 py-2 text-white text-sm"

                                  />

                                </div>

                                <div>

                                  <label className="block text-sm font-medium text-gray-300 mb-1">Max Value</label>

                                  <input

                                    type="number"

                                    value={field.validation?.max || ''}

                                    onChange={(e) => {

                                      const newFields = [...customizationForm.customFields];

                                      newFields[index].validation = {

                                        ...newFields[index].validation,

                                        max: e.target.value ? parseInt(e.target.value) : undefined

                                      };

                                      setCustomizationForm(prev => ({ ...prev, customFields: newFields }));

                                    }}

                                    className="w-full bg-[#0F0F0F] border border-[#2A2A2A] rounded px-3 py-2 text-white text-sm"

                                  />

                                </div>

                              </div>

                            )}



                            {field.type === 'select' && (

                              <div>

                                <label className="block text-sm font-medium text-gray-300 mb-1">Options (comma separated)</label>

                                <input

                                  type="text"

                                  value={field.options?.join(', ') || ''}

                                  onChange={(e) => {

                                    const newFields = [...customizationForm.customFields];

                                    newFields[index].options = e.target.value.split(',').map(s => s.trim()).filter(Boolean);

                                    setCustomizationForm(prev => ({ ...prev, customFields: newFields }));

                                  }}

                                  className="w-full bg-[#0F0F0F] border border-[#2A2A2A] rounded px-3 py-2 text-white text-sm"

                                  placeholder="Option 1, Option 2, Option 3"

                                />

                              </div>

                            )}

                          </div>

                        ))}

                      </div>

                    </div>

                  )}



                  {/* Sizes Configuration */}

                  {customizationForm.hasSizes && (

                    <div className="bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg p-4">

                      <div className="flex justify-between items-center mb-4">

                        <h4 className="text-lg font-semibold text-white">Size Options</h4>

                        <button

                          onClick={() => setCustomizationForm(prev => ({

                            ...prev,

                            sizes: [...prev.sizes, {

                              id: `size_${Date.now()}`,

                              name: '',

                              priceModifier: 0,

                              available: true

                            }]

                          }))}

                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"

                        >

                          Add Size

                        </button>

                      </div>



                      <div className="space-y-4">

                        {customizationForm.sizes.map((size, index) => (

                          <div key={size.id} className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-4">

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

                              <div>

                                <label className="block text-sm font-medium text-gray-300 mb-1">Size Name</label>

                                <input

                                  type="text"

                                  value={size.name}

                                  onChange={(e) => {

                                    const newSizes = [...customizationForm.sizes];

                                    newSizes[index].name = e.target.value;

                                    setCustomizationForm(prev => ({ ...prev, sizes: newSizes }));

                                  }}

                                  className="w-full bg-[#0F0F0F] border border-[#2A2A2A] rounded px-3 py-2 text-white text-sm"

                                  placeholder="e.g., Small, Medium, Large"

                                />

                              </div>



                              <div>

                                <label className="block text-sm font-medium text-gray-300 mb-1">Price Modifier</label>

                                <input

                                  type="number"

                                  value={size.priceModifier || 0}

                                  onChange={(e) => {

                                    const newSizes = [...customizationForm.sizes];

                                    newSizes[index].priceModifier = parseFloat(e.target.value) || 0;

                                    setCustomizationForm(prev => ({ ...prev, sizes: newSizes }));

                                  }}

                                  className="w-full bg-[#0F0F0F] border border-[#2A2A2A] rounded px-3 py-2 text-white text-sm"

                                  placeholder="0.00"

                                  step="0.01"

                                />

                              </div>



                              <div>

                                <label className="block text-sm font-medium text-gray-300 mb-1">Available</label>

                                <input

                                  type="checkbox"

                                  checked={size.available}

                                  onChange={(e) => {

                                    const newSizes = [...customizationForm.sizes];

                                    newSizes[index].available = e.target.checked;

                                    setCustomizationForm(prev => ({ ...prev, sizes: newSizes }));

                                  }}

                                  className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500"

                                />

                              </div>



                              <div>

                                <label className="block text-sm font-medium text-gray-300 mb-1">Actions</label>

                                <button

                                  onClick={() => setCustomizationForm(prev => ({

                                    ...prev,

                                    sizes: prev.sizes.filter((_, i) => i !== index)

                                  }))}

                                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"

                                >

                                  Remove

                                </button>

                              </div>

                            </div>

                          </div>

                        ))}

                      </div>

                    </div>

                  )}



                  {/* Action Buttons */}

                  <div className="flex gap-3 pt-4 border-t border-[#2A2A2A]">

                    <button

                      onClick={() => setSelectedProductForCustomization(null)}

                      className="flex-1 bg-[#2A2A2A] hover:bg-[#3A3A3A] text-white font-medium py-2 px-4 rounded-lg"

                    >

                      Cancel

                    </button>

                    <button

                      onClick={handleUpdateProductCustomization}

                      className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg"

                    >

                      Save Customization

                    </button>

                  </div>

                </div>

              </div>

            </div>

          </div>

        )}



      </div>

    </div>

  );

}

