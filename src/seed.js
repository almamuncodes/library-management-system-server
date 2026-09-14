require('dotenv').config();
const dns = require('node:dns');
try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (e) {}

const mongoose = require('mongoose');
const Book = require('./models/Book');
const Borrow = require('./models/Borrow');

const sampleBooks = [
  {
    title: 'Clean Code: A Handbook of Agile Software Craftsmanship',
    author: 'Robert C. Martin',
    category: 'Programming',
    quantity: 5,
    availableQuantity: 5,
    isFeatured: true,
    coverImage: 'https://images.unsplash.com/photo-1532012164546-f432f2e37072?w=500&auto=format&fit=crop&q=60',
    description: 'Even bad code can function. But if code isn’t clean, it can bring a development organization to its knees.',
  },
  {
    title: 'JavaScript: The Definitive Guide',
    author: 'David Flanagan',
    category: 'Programming',
    quantity: 4,
    availableQuantity: 4,
    isFeatured: true,
    coverImage: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=60',
    description: 'Master the World’s Most-Used Programming Language with in-depth coverage and hands-on examples.',
  },
  {
    title: 'A Brief History of Time',
    author: 'Stephen Hawking',
    category: 'Science',
    quantity: 3,
    availableQuantity: 3,
    isFeatured: true,
    coverImage: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=500&auto=format&fit=crop&q=60',
    description: 'Explores profound questions about the universe, black holes, time travel, and the origin of cosmos.',
  },
  {
    title: 'To Kill a Mockingbird',
    author: 'Harper Lee',
    category: 'Novel',
    quantity: 6,
    availableQuantity: 6,
    isFeatured: false,
    coverImage: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=500&auto=format&fit=crop&q=60',
    description: 'A Pulitzer Prize-winning classic novel of a childhood in a sleepy Southern town and the crisis of conscience.',
  },
  {
    title: 'The Pragmatic Programmer',
    author: 'Andrew Hunt & David Thomas',
    category: 'Programming',
    quantity: 3,
    availableQuantity: 3,
    isFeatured: true,
    coverImage: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=500&auto=format&fit=crop&q=60',
    description: 'Your journey to mastery: from coding habits to project management and personal career growth.',
  },
  {
    title: 'Sapiens: A Brief History of Humankind',
    author: 'Yuval Noah Harari',
    category: 'History',
    quantity: 4,
    availableQuantity: 4,
    isFeatured: false,
    coverImage: 'https://images.unsplash.com/photo-1461360370896-922624d12aa1?w=500&auto=format&fit=crop&q=60',
    description: 'How an insignificant ape became the ruler of planet Earth, capable of splitting the atom and journeying to the Moon.',
  },
  {
    title: 'Cosmos',
    author: 'Carl Sagan',
    category: 'Science',
    quantity: 4,
    availableQuantity: 4,
    isFeatured: false,
    coverImage: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=500&auto=format&fit=crop&q=60',
    description: 'A personal voyage through fifteen billion years of cosmic evolution transforming science into human culture.',
  }
];

const seedData = async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/library_management';
    await mongoose.connect(uri);
    console.log('Connected to MongoDB for seeding...');

    await Book.deleteMany({});
    await Borrow.deleteMany({});

    const created = await Book.insertMany(sampleBooks);
    console.log(`✅ Successfully seeded ${created.length} books directly into MongoDB!`);

    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error.message);
    process.exit(1);
  }
};

seedData();
