import React, { createContext, useContext, useState, useEffect } from 'react';
import type { LocationNode, Thing, SearchHistoryEntry } from '../types';
import { INITIAL_ROOMS, INITIAL_LOCATIONS, INITIAL_THINGS } from '../data/demoData';

interface InventoryContextType {
  nodes: LocationNode[]; // Combined rooms and sub-locations
  things: Thing[];
  searchHistory: SearchHistoryEntry[];
  currentView: 'dashboard' | 'map' | 'add' | 'ask' | 'things' | 'ar';
  selectedThingIdForAR: string | null;
  setView: (view: 'dashboard' | 'map' | 'add' | 'ask' | 'things' | 'ar') => void;
  selectThingForAR: (thingId: string | null) => void;
  
  // Auth state
  userEmail: string | null;
  isAuthenticated: boolean;
  loginUser: (email: string) => void;
  logout: () => void;
  
  // Node management (rooms + sub-locations)
  addNode: (name: string, type: LocationNode['type'], parentId: string | null, icon: string, photo?: string) => string;
  updateNode: (id: string, name: string, icon: string) => void;
  deleteNode: (id: string) => void;

  // Thing management
  addThing: (thing: Omit<Thing, 'id' | 'lastUpdated' | 'frequencySearched'>) => void;
  updateThing: (thing: Thing) => void;
  deleteThing: (id: string) => void;
  incrementSearchCount: (id: string) => void;

  // Search logic
  searchThings: (query: string) => { thing: Thing; score: number }[];
  addSearchHistory: (query: string) => void;
  clearSearchHistory: () => void;
  getLocationPathString: (thing: Thing) => string;
  getLocationNodeList: (thing: Thing) => LocationNode[];
  loadDemoData: () => void;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

const STOP_WORDS = new Set([
  'where', 'is', 'my', 'the', 'find', 'get', 'show', 'locate', 'search',
  'kahan', 'hai', 'kidhar', 'kaha', 'dhoondho', 'mera', 'meri', 'mere', 'paas', 'rakha', 'tha', 'rakhi',
  'in', 'at', 'on', 'under', 'inside', 'to', 'for', 'a', 'an', 'are', 'what', 'kya', 'dikhao', 'kahan-hai',
  'batao', 'milega', 'rakha-hai'
]);

function cleanText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "")
    .trim();
}

function getTerms(query: string): string[] {
  const cleaned = cleanText(query);
  return cleaned
    .split(/\s+/)
    .filter(word => word.length > 0 && !STOP_WORDS.has(word));
}

// Simple Levenshtein distance for fuzzy matching
function levenshtein(a: string, b: string): number {
  const matrix = Array.from({ length: a.length + 1 }, (_, i) => 
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      if (a[i - 1] === b[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,    // Deletion
          matrix[i][j - 1] + 1,    // Insertion
          matrix[i - 1][j - 1] + 1 // Substitution
        );
      }
    }
  }
  return matrix[a.length][b.length];
}

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load initial data from localStorage or fallback to demo data
  const [nodes, setNodes] = useState<LocationNode[]>(() => {
    const saved = localStorage.getItem('dhundho_nodes');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return [...INITIAL_ROOMS, ...INITIAL_LOCATIONS];
  });

  const [things, setThings] = useState<Thing[]>(() => {
    const saved = localStorage.getItem('dhundho_things');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_THINGS;
  });

  const [searchHistory, setSearchHistory] = useState<SearchHistoryEntry[]>(() => {
    const saved = localStorage.getItem('dhundho_search_history');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return [];
  });

  const [currentView, setView] = useState<InventoryContextType['currentView']>('dashboard');
  const [selectedThingIdForAR, selectThingForAR] = useState<string | null>(null);

  // Authentication state
  const [userEmail, setUserEmail] = useState<string | null>(() => {
    return localStorage.getItem('dhundho_user_email');
  });
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('dhundho_authenticated') === 'true';
  });

  const loginUser = (email: string) => {
    setUserEmail(email);
    setIsAuthenticated(true);
    localStorage.setItem('dhundho_user_email', email);
    localStorage.setItem('dhundho_authenticated', 'true');
  };

  const logout = () => {
    setUserEmail(null);
    setIsAuthenticated(false);
    localStorage.removeItem('dhundho_user_email');
    localStorage.removeItem('dhundho_authenticated');
  };

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('dhundho_nodes', JSON.stringify(nodes));
  }, [nodes]);

  useEffect(() => {
    localStorage.setItem('dhundho_things', JSON.stringify(things));
  }, [things]);

  useEffect(() => {
    localStorage.setItem('dhundho_search_history', JSON.stringify(searchHistory));
  }, [searchHistory]);

  // Operations: Nodes
  const addNode = (name: string, type: LocationNode['type'], parentId: string | null, icon: string, photo?: string): string => {
    const id = `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newNode: LocationNode = { id, name, type, parentId, icon, photo };
    setNodes(prev => [...prev, newNode]);
    return id;
  };

  const updateNode = (id: string, name: string, icon: string) => {
    setNodes(prev => prev.map(n => n.id === id ? { ...n, name, icon } : n));
  };

  const deleteNode = (id: string) => {
    // Helper to recursively get all child node IDs
    const getChildIds = (parentId: string): string[] => {
      const children = nodes.filter(n => n.parentId === parentId);
      return [parentId, ...children.flatMap(c => getChildIds(c.id))];
    };

    const idsToDelete = getChildIds(id);
    setNodes(prev => prev.filter(n => !idsToDelete.includes(n.id)));
    // Also remove or update location path of things that contain deleted node
    setThings(prev => prev.filter(thing => {
      // If the thing's path has a deleted node, delete the thing or trim it?
      // MVP choice: delete the thing or keep it if room remains, but if the main location is deleted, remove it.
      return !thing.locationPath.some(pathId => idsToDelete.includes(pathId));
    }));
  };

  // Operations: Things
  const addThing = (thingData: Omit<Thing, 'id' | 'lastUpdated' | 'frequencySearched'>) => {
    const id = `thing-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newThing: Thing = {
      ...thingData,
      id,
      lastUpdated: new Date().toISOString(),
      frequencySearched: 0
    };
    setThings(prev => [newThing, ...prev]);
  };

  const updateThing = (updatedThing: Thing) => {
    setThings(prev => prev.map(t => t.id === updatedThing.id ? { 
      ...updatedThing, 
      lastUpdated: new Date().toISOString() 
    } : t));
  };

  const deleteThing = (id: string) => {
    setThings(prev => prev.filter(t => t.id !== id));
  };

  const incrementSearchCount = (id: string) => {
    setThings(prev => prev.map(t => t.id === id ? { 
      ...t, 
      frequencySearched: t.frequencySearched + 1 
    } : t));
  };

  // Helper to construct path string, e.g. "Bedroom → Wardrobe → Top Drawer"
  const getLocationPathString = (thing: Thing): string => {
    return thing.locationPath
      .map(nodeId => nodes.find(n => n.id === nodeId)?.name || '')
      .filter(Boolean)
      .join(' → ');
  };

  // Helper to retrieve location nodes list
  const getLocationNodeList = (thing: Thing): LocationNode[] => {
    return thing.locationPath
      .map(nodeId => nodes.find(n => n.id === nodeId))
      .filter((n): n is LocationNode => !!n);
  };

  // Search logic
  const searchThings = (query: string): { thing: Thing; score: number }[] => {
    const cleanQ = cleanText(query);
    if (!cleanQ) return [];

    const queryTerms = getTerms(query);
    
    // If no terms left after stop words, use the entire cleaned query string as a single term
    const searchTerms = queryTerms.length > 0 ? queryTerms : [cleanQ];

    const results = things.map(thing => {
      let score = 0;
      const thingNameClean = cleanText(thing.name);
      
      // 1. Exact match on name
      if (thingNameClean === cleanQ) {
        score += 150;
      }
      
      // 2. Substring match on name
      if (thingNameClean.includes(cleanQ)) {
        score += 80;
      }

      // Check each search term
      searchTerms.forEach(term => {
        // Word matches inside name
        if (thingNameClean.split(/\s+/).includes(term)) {
          score += 60;
        } else if (thingNameClean.includes(term)) {
          score += 30;
        }

        // Fuzzy match on name (Levenshtein distance <= 2)
        const nameWords = thingNameClean.split(/\s+/);
        nameWords.forEach(word => {
          if (word.length >= 3 && term.length >= 3) {
            const dist = levenshtein(word, term);
            if (dist === 0) score += 60;
            else if (dist === 1) score += 40;
            else if (dist === 2) score += 20;
          }
        });

        // 3. Category match
        if (cleanText(thing.category).includes(term)) {
          score += 25;
        }

        // 4. Tag match
        thing.tags.forEach(tag => {
          const tagClean = cleanText(tag);
          if (tagClean === term) {
            score += 50;
          } else if (tagClean.includes(term)) {
            score += 20;
          }
          // Fuzzy tag match
          if (tagClean.length >= 3 && term.length >= 3) {
            const dist = levenshtein(tagClean, term);
            if (dist <= 1) score += 30;
          }
        });

        // 5. Notes match
        if (cleanText(thing.notes).includes(term)) {
          score += 15;
        }

        // 6. Location name match (e.g. if searching for "wardrobe batteries", match wardrobe location)
        thing.locationPath.forEach(nodeId => {
          const node = nodes.find(n => n.id === nodeId);
          if (node) {
            const nodeNameClean = cleanText(node.name);
            if (nodeNameClean.includes(term)) {
              score += 25;
            }
          }
        });
      });

      return { thing, score };
    });

    // Filter out scores that are 0 or too low, sort descending
    return results
      .filter(r => r.score > 0)
      .sort((a, b) => b.score - a.score);
  };

  const addSearchHistory = (query: string) => {
    const cleaned = query.trim();
    if (!cleaned) return;
    
    const newEntry: SearchHistoryEntry = {
      id: `sh-${Date.now()}`,
      query: cleaned,
      timestamp: new Date().toISOString()
    };

    setSearchHistory(prev => {
      // Remove duplicate if it exists and put new one at start
      const filtered = prev.filter(entry => entry.query.toLowerCase() !== cleaned.toLowerCase());
      return [newEntry, ...filtered].slice(0, 10); // keep last 10
    });
  };

  const clearSearchHistory = () => {
    setSearchHistory([]);
  };

  const loadDemoData = () => {
    setNodes([...INITIAL_ROOMS, ...INITIAL_LOCATIONS]);
    setThings(INITIAL_THINGS);
  };

  return (
    <InventoryContext.Provider value={{
      nodes,
      things,
      searchHistory,
      currentView,
      selectedThingIdForAR,
      setView,
      selectThingForAR,
      userEmail,
      isAuthenticated,
      loginUser,
      logout,
      addNode,
      updateNode,
      deleteNode,
      addThing,
      updateThing,
      deleteThing,
      incrementSearchCount,
      searchThings,
      addSearchHistory,
      clearSearchHistory,
      getLocationPathString,
      getLocationNodeList,
      loadDemoData
    }}>
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (context === undefined) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};
