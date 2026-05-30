import { useState, useEffect, useRef } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Search, UserPlus, MessageCircle, Globe, Send, Check, Users } from 'lucide-react';
import api from '../../utils/api';
import { getSocket } from '../../hooks/useSocket';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import BookCard from '../../components/common/BookCard';
import toast from 'react-hot-toast';

// ─── WriterNetwork ────────────────────────────────────────────────────────────
export function WriterNetwork() {
  const { user } = useSelector(s => s.auth);
  const [writers, setWriters] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState({});

  const searchWriters = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/writers/search?q=${search}`);
      setWriters(data.writers || []);
    } catch { }
    finally { setLoading(false); }
  };

  useEffect(() => { searchWriters(); }, []);

  const sendRequest = async (writerId) => {
    setSending(s => ({ ...s, [writerId]: true }));
    try {
      await api.post(`/writers/${writerId}/friend-request`);
      toast.success('Friend request sent!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally { setSending(s => ({ ...s, [writerId]: false })); }
  };

  const startChat = async (writerId, navigate) => {
    try {
      const { data } = await api.post('/writers/conversation', { participantId: writerId });
      navigate(`/writer/chat/${data.conversation._id}`);
    } catch { toast.error('Could not start chat'); }
  };

  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-2">
        <Users className="w-6 h-6 text-primary-600" />
        <h1 className="text-2xl font-bold text-gray-900">Writer Network</h1>
      </div>
      <p className="text-gray-500 text-sm mb-8">Connect with authors worldwide. Messages auto-translate to your language.</p>

      {/* Search */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input className="input pl-9" placeholder="Search writers by name or country…" value={search}
            onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && searchWriters()} />
        </div>
        <button onClick={searchWriters} className="btn-primary px-5">Search</button>
      </div>

      {loading ? <LoadingSpinner /> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {writers.filter(w => w._id !== user?._id).map(writer => (
            <WriterCard key={writer._id} writer={writer} onConnect={sendRequest} onChat={startChat} sending={sending} />
          ))}
          {writers.length === 0 && (
            <div className="col-span-full text-center py-16 text-gray-400">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p>No writers found. Try a different search.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function WriterCard({ writer, onConnect, onChat, sending }) {
  const navigate = useNavigate();
  return (
    <div className="card p-5 hover:shadow-md transition-all">
      <div className="flex items-start gap-3">
        <img src={writer.avatar || `https://ui-avatars.com/api/?name=${writer.name}&background=4f46e5&color=fff`}
          alt={writer.name} className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <Link to={`/writer/profile/${writer._id}`} className="font-semibold text-gray-900 hover:text-primary-600">{writer.name}</Link>
          {writer.writerProfile?.country && (
            <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
              <Globe className="w-3 h-3" /> {writer.writerProfile.country}
            </p>
          )}
          {writer.writerProfile?.language && (
            <span className="badge bg-indigo-100 text-indigo-700 text-xs mt-1">🗣 {writer.writerProfile.language}</span>
          )}
          {writer.writerProfile?.bio && (
            <p className="text-xs text-gray-500 mt-2 line-clamp-2">{writer.writerProfile.bio}</p>
          )}
          <p className="text-xs text-gray-400 mt-2">{writer.writerProfile?.followers?.length || 0} followers</p>
        </div>
      </div>
      <div className="flex gap-2 mt-4">
        <button onClick={() => onConnect(writer._id)} disabled={sending[writer._id]}
          className="flex-1 text-xs py-2 border border-primary-200 text-primary-600 rounded-lg hover:bg-primary-50 flex items-center justify-center gap-1 transition disabled:opacity-50">
          <UserPlus className="w-3 h-3" /> Connect
        </button>
        <button onClick={() => onChat(writer._id, navigate)}
          className="flex-1 text-xs py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-1 transition">
          <MessageCircle className="w-3 h-3" /> Message
        </button>
      </div>
    </div>
  );
}

// ─── WriterChat ───────────────────────────────────────────────────────────────
export function WriterChat() {
  const { conversationId } = useParams();
  const { user } = useSelector(s => s.auth);
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [activeConv, setActiveConv] = useState(conversationId || null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [typing, setTyping] = useState(false);
  const [typingUser, setTypingUser] = useState('');
  const messagesEndRef = useRef(null);
  const socket = getSocket();

  useEffect(() => {
    api.get('/writers/conversations').then(r => setConversations(r.data.conversations || [])).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!activeConv) return;
    api.get(`/writers/conversation/${activeConv}/messages`).then(r => setMessages(r.data.messages || []));

    if (socket) {
      socket.emit('join_conversation', activeConv);
      socket.on('new_message', (msg) => {
        if (msg.conversationId === activeConv) setMessages(prev => [...prev, msg]);
      });
      socket.on('user_typing', ({ name }) => { setTypingUser(name); setTyping(true); });
      socket.on('user_stop_typing', () => setTyping(false));
      return () => {
        socket.emit('leave_conversation', activeConv);
        socket.off('new_message');
        socket.off('user_typing');
        socket.off('user_stop_typing');
      };
    }
  }, [activeConv, socket]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket || !activeConv) return;
    setSending(true);
    socket.emit('send_message', { conversationId: activeConv, text: newMessage });
    setNewMessage('');
    setSending(false);
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    if (socket && activeConv) {
      socket.emit('typing', { conversationId: activeConv });
      clearTimeout(window._typingTimeout);
      window._typingTimeout = setTimeout(() => socket.emit('stop_typing', { conversationId: activeConv }), 1500);
    }
  };

  const getOtherUser = (conv) => conv.participants?.find(p => p._id !== user?._id);

  return (
    <div className="flex h-full">
      {/* Conversations sidebar */}
      <div className="w-72 border-r border-gray-200 flex flex-col bg-white">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Messages</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? <LoadingSpinner size="sm" /> : conversations.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm px-4">
              <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p>No conversations yet.</p>
              <Link to="/writer/network" className="text-primary-600 text-xs hover:underline">Find writers to connect</Link>
            </div>
          ) : (
            conversations.map(conv => {
              const other = getOtherUser(conv);
              return (
                <button key={conv._id} onClick={() => setActiveConv(conv._id)}
                  className={`w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors border-b border-gray-50 ${activeConv === conv._id ? 'bg-primary-50 border-primary-100' : ''}`}>
                  <img src={other?.avatar || `https://ui-avatars.com/api/?name=${other?.name}&background=4f46e5&color=fff`}
                    alt={other?.name} className="w-10 h-10 rounded-full flex-shrink-0" />
                  <div className="flex-1 min-w-0 text-left">
                    <p className="font-medium text-sm text-gray-900">{other?.name}</p>
                    <p className="text-xs text-gray-400 truncate">{conv.lastMessage?.originalText || 'Start chatting…'}</p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Chat window */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {!activeConv ? (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Select a conversation to start messaging</p>
              <p className="text-sm mt-1 text-indigo-400">💡 Messages auto-translate to each writer's language</p>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            {(() => {
              const conv = conversations.find(c => c._id === activeConv);
              const other = conv ? getOtherUser(conv) : null;
              return other ? (
                <div className="bg-white border-b border-gray-200 px-5 py-3 flex items-center gap-3">
                  <img src={other.avatar || `https://ui-avatars.com/api/?name=${other.name}&background=4f46e5&color=fff`}
                    alt={other.name} className="w-9 h-9 rounded-full" />
                  <div>
                    <p className="font-medium text-sm">{other.name}</p>
                    <p className="text-xs text-indigo-500">🌐 Auto-translate enabled</p>
                  </div>
                </div>
              ) : null;
            })()}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {messages.map((msg, i) => {
                const isOwn = msg.sender?._id === user?._id || msg.sender === user?._id;
                return (
                  <div key={i} className={`flex items-end gap-2 ${isOwn ? 'flex-row-reverse' : ''}`}>
                    {!isOwn && (
                      <img src={msg.sender?.avatar || `https://ui-avatars.com/api/?name=${msg.sender?.name}&background=4f46e5&color=fff`}
                        alt="" className="w-7 h-7 rounded-full flex-shrink-0" />
                    )}
                    <div className={`max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl text-sm ${isOwn ? 'bg-primary-600 text-white rounded-br-md' : 'bg-white text-gray-800 shadow-sm rounded-bl-md'}`}>
                      <p>{msg.displayText || msg.originalText}</p>
                      {!isOwn && msg.displayText && msg.displayText !== msg.originalText && (
                        <p className="text-xs opacity-60 mt-1 italic">{msg.originalText}</p>
                      )}
                    </div>
                  </div>
                );
              })}
              {typing && <p className="text-xs text-gray-400 italic pl-10">{typingUser} is typing…</p>}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={sendMessage} className="bg-white border-t border-gray-200 p-4 flex gap-3">
              <input className="input flex-1 text-sm" placeholder="Type a message… (auto-translated for recipient)"
                value={newMessage} onChange={handleTyping} />
              <button type="submit" disabled={sending || !newMessage.trim()} className="btn-primary p-3 aspect-square flex items-center justify-center disabled:opacity-50">
                <Send className="w-4 h-4" />
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

// ─── WriterProfile ────────────────────────────────────────────────────────────
export function WriterProfile() {
  const { id } = useParams();
  const { user } = useSelector(s => s.auth);
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/writers/${id}`).then(r => { setProfile(r.data.writer); setBooks(r.data.books || []); }).finally(() => setLoading(false));
  }, [id]);

  const startChat = async () => {
    try {
      const { data } = await api.post('/writers/conversation', { participantId: id });
      navigate(`/writer/chat/${data.conversation._id}`);
    } catch { toast.error('Could not start chat'); }
  };

  if (loading) return <LoadingSpinner />;
  if (!profile) return <div className="p-8 text-gray-400">Profile not found or private</div>;

  return (
    <div className="p-8 max-w-4xl">
      <div className="card p-6 mb-6">
        <div className="flex items-start gap-5">
          <img src={profile.avatar || `https://ui-avatars.com/api/?name=${profile.name}&background=4f46e5&color=fff&size=100`}
            alt={profile.name} className="w-20 h-20 rounded-full object-cover flex-shrink-0" />
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{profile.name}</h1>
            {profile.writerProfile?.country && <p className="text-gray-500 text-sm flex items-center gap-1 mt-1"><Globe className="w-4 h-4" />{profile.writerProfile.country}</p>}
            {profile.writerProfile?.bio && <p className="text-gray-600 text-sm mt-3 leading-relaxed">{profile.writerProfile.bio}</p>}
            <div className="flex gap-4 mt-4 text-sm text-gray-500">
              <span>{books.length} books</span>
              <span>{profile.writerProfile?.followers?.length || 0} followers</span>
            </div>
          </div>
          {user?._id !== id && (
            <div className="flex gap-2">
              <button onClick={startChat} className="btn-primary flex items-center gap-2 text-sm py-2 px-4">
                <MessageCircle className="w-4 h-4" /> Message
              </button>
            </div>
          )}
        </div>
      </div>
      <h2 className="font-semibold text-gray-900 mb-4">Books by {profile.name}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {books.map(book => <BookCard key={book._id} book={book} />)}
        {books.length === 0 && <p className="col-span-full text-gray-400 text-sm">No published books yet</p>}
      </div>
    </div>
  );
}

export default WriterNetwork;
