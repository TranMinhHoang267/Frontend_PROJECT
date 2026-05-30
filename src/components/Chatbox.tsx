import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  MapPin,
  DollarSign,
  Loader2,
  Bot,
  User,
  ChevronRight,
  TrendingUp
} from "lucide-react";
import { chatService } from "../services/chat.service";
import { useAuthStore } from "../stores/authStore";

interface MessageUI {
  sender: "user" | "ai";
  text: string;
  list?: Array<{
    id?: string;
    title?: string;
    company?: string;
    description?: string;
    salary?: string;
    location?: string;
    score?: number;
    reasoning?: string;
    suggestions?: string;
  }>;
  createdAt?: Date;
}

export default function Chatbox() {
  const { isAuthenticated, user } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<MessageUI[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFrozen, setIsFrozen] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Quick suggestions for the user
  const suggestions = [
    { label: "🔍 Tìm việc NodeJS", query: "Tìm kiếm công việc NodeJS" },
    { label: "📄 Gợi ý việc từ CV", query: "Gợi ý việc làm phù hợp với CV của tôi" },
    { label: "⚖️ Đánh giá CV vs Job", query: "So sánh CV của tôi với một công việc bất kỳ" },
    { label: "🏢 Hỏi về công ty", query: "Hãy giới thiệu một số công ty nổi bật" }
  ];

  // Load chat history on mount
  useEffect(() => {
    if (!isAuthenticated) {
      setMessages([]);
      setIsFrozen(false);
      return;
    }

    const fetchHistory = async () => {
      try {
        const response = await chatService.getHistory();
        if (response.type === "SUCCESS" && response.data) {
          setIsFrozen(response.data.isFrozen);
          const historyList: MessageUI[] = [];
          
          // The history is ordered desc (newest first). Let's reverse it to show chronologically
          const sortedHistory = [...response.data.history].reverse();
          
          sortedHistory.forEach((item) => {
            // Add user question
            historyList.push({
              sender: "user",
              text: item.question,
              createdAt: item.createdAt ? new Date(item.createdAt) : new Date()
            });

            // Parse and add AI response
            let aiText = "";
            let listData: MessageUI["list"] = undefined;
            
            try {
              if (item.answer) {
                const parsed = JSON.parse(item.answer);
                aiText = parsed.message || item.template || "Đây là kết quả tôi tìm thấy:";
                if (parsed.list) {
                  listData = parsed.list;
                } else if (parsed.jobs) {
                  listData = parsed.jobs;
                } else if (Array.isArray(parsed)) {
                  listData = parsed;
                }
              } else {
                aiText = item.template || "Đã có phản hồi từ AI";
              }
            } catch {
              aiText = item.answer || item.template || "";
            }

            historyList.push({
              sender: "ai",
              text: aiText,
              list: listData,
              createdAt: item.createdAt ? new Date(item.createdAt) : new Date()
            });
          });

          if (historyList.length === 0) {
            // Default greeting message if history is empty
            historyList.push({
              sender: "ai",
              text: "Xin chào! Tôi là Trợ lý ảo JobConnect. Tôi có thể giúp gì cho bạn hôm nay? Bạn có thể hỏi tôi về tìm kiếm việc làm, gợi ý công việc phù hợp với CV, hoặc so sánh đánh giá hồ sơ của bạn với các tin tuyển dụng.",
            });
          }

          setMessages(historyList);
        }
      } catch (err) {
        console.error("Lỗi khi tải lịch sử chat:", err);
        // Fallback welcome message
        setMessages([
          {
            sender: "ai",
            text: "Xin chào! Tôi là Trợ lý ảo JobConnect. Tôi có thể giúp gì cho bạn hôm nay? Bạn có thể hỏi tôi về tìm kiếm việc làm, gợi ý công việc phù hợp với CV, hoặc so sánh đánh giá hồ sơ của bạn với các tin tuyển dụng.",
          }
        ]);
      }
    };

    fetchHistory();
  }, [isAuthenticated, user?.id]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const userText = textToSend.trim();
    setInputValue("");
    setMessages((prev) => [...prev, { sender: "user", text: userText }]);
    setIsLoading(true);

    try {
      const response = await chatService.sendMessage(userText);
      
      let aiText = "";
      let listData: MessageUI["list"] = undefined;

      if (response.type === "SUCCESS" && response.data) {
        aiText = response.data.message || "";
        if (response.data.list) {
          listData = response.data.list;
        }
      } else {
        aiText = String(response.message) || "Xin lỗi, đã xảy ra lỗi trong quá trình xử lý.";
      }

      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: aiText,
          list: listData,
          createdAt: new Date()
        }
      ]);
    } catch (err: unknown) {
      console.error("Lỗi gửi tin nhắn chat:", err);
      let errMsg = "Đã xảy ra lỗi kết nối. Vui lòng thử lại sau.";
      const error = err as { response?: { data?: { message?: string } } };
      if (error.response?.data?.message) {
        errMsg = error.response.data.message;
      }
      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: errMsg,
          createdAt: new Date()
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Floating Chat Window */}
      {isOpen && (
        <div className="w-[380px] sm:w-[420px] h-[580px] bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-2xl flex flex-col mb-4 overflow-hidden transition-all duration-300 transform translate-y-0 scale-100 origin-bottom-right">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-[#1e3fae] to-[#2563eb] text-white flex items-center justify-between shadow-md">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-white/10 rounded-lg">
                <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
              </div>
              <div>
                <h3 className="font-bold text-sm leading-tight">Trợ lý ảo AI</h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full animate-ping"></span>
                  <span className="text-[11px] text-blue-100 font-medium">Đang hoạt động</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              title="Đóng chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex gap-3 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                {/* AI Avatar */}
                {msg.sender === "ai" && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#1e3fae] to-blue-500 flex items-center justify-center text-white flex-shrink-0 shadow-sm border border-blue-200">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                {/* Bubble content */}
                <div className="max-w-[80%] flex flex-col">
                  <div
                    className={`px-4 py-2.5 rounded-2xl text-[14px] leading-relaxed shadow-sm ${
                      msg.sender === "user"
                        ? "bg-[#1e3fae] text-white rounded-br-none"
                        : "bg-white text-slate-800 border border-slate-100 rounded-bl-none"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  </div>

                  {/* Recommendations (list of jobs) */}
                  {msg.list && msg.list.length > 0 && (
                    <div className="mt-3 space-y-2.5 w-full">
                      {msg.list.map((job, idx) => (
                        <div
                          key={idx}
                          className="bg-white border border-slate-200/80 rounded-xl p-3 shadow-sm hover:border-[#1e3fae]/50 transition-colors flex flex-col gap-2"
                        >
                          {job.score !== undefined && (
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Đánh giá độ khớp</span>
                              <span className="flex items-center gap-1 text-xs font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                                <TrendingUp className="w-3.5 h-3.5" />
                                {job.score}/10
                              </span>
                            </div>
                          )}

                          <div>
                            <h4 className="font-bold text-slate-900 text-sm hover:text-[#1e3fae] transition-colors line-clamp-1">
                              {job.title}
                            </h4>
                            {job.company && (
                              <p className="text-xs text-slate-500 font-semibold mt-0.5">{job.company}</p>
                            )}
                          </div>

                          {(job.location || job.salary) && (
                            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-[11px] text-slate-600">
                              {job.location && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                  {job.location}
                                </span>
                              )}
                              {job.salary && (
                                <span className="flex items-center gap-1 font-medium text-blue-600">
                                  <DollarSign className="w-3.5 h-3.5 text-blue-400" />
                                  {job.salary}
                                </span>
                              )}
                            </div>
                          )}

                          {job.reasoning && (
                            <p className="text-xs text-slate-600 mt-1 bg-slate-50 p-2 rounded-lg border border-slate-100 italic">
                              <strong>Lý do:</strong> {job.reasoning}
                            </p>
                          )}
                          
                          {job.suggestions && (
                            <p className="text-xs text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-100">
                              <strong>Khuyên dùng:</strong> {job.suggestions}
                            </p>
                          )}

                          {job.id && (
                            <Link
                              to={`/candidate/jobs/${job.id}`}
                              onClick={() => setIsOpen(false)}
                              className="mt-1 flex items-center justify-center gap-1 py-1.5 px-3 bg-[#1e3fae]/5 hover:bg-[#1e3fae]/10 text-[#1e3fae] rounded-lg text-xs font-bold transition"
                            >
                              Xem chi tiết công việc
                              <ChevronRight className="w-3.5 h-3.5" />
                            </Link>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {msg.createdAt && (
                    <span className={`text-[10px] text-slate-400 mt-1 ${msg.sender === "user" ? "text-right" : "text-left"}`}>
                      {msg.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>

                {/* User Avatar */}
                {msg.sender === "user" && (
                  <div className="w-8 h-8 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center text-slate-600 flex-shrink-0 shadow-sm">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {/* AI Typing loading indicator */}
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#1e3fae] to-blue-500 flex items-center justify-center text-white flex-shrink-0 shadow-sm">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-white border border-slate-100 px-4 py-3 rounded-2xl rounded-bl-none shadow-sm flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-[#1e3fae] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-[#1e3fae] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-[#1e3fae] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Quick recommendations */}
          {messages.length <= 2 && !isLoading && (
            <div className="px-4 py-2 bg-slate-50 border-t border-slate-100">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Gợi ý câu hỏi</p>
              <div className="flex flex-wrap gap-1.5">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSend(suggestion.query)}
                    className="text-xs px-2.5 py-1 bg-white hover:bg-[#1e3fae]/5 border border-slate-200 hover:border-[#1e3fae]/30 text-slate-700 hover:text-[#1e3fae] rounded-full transition cursor-pointer font-medium"
                  >
                    {suggestion.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(inputValue);
            }}
            className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={isFrozen ? "Đã khóa chat (Quá 24h)..." : "Nhập câu hỏi tại đây..."}
              disabled={isLoading || isFrozen}
              className="flex-1 bg-slate-100 hover:bg-slate-100/80 focus:bg-white text-slate-800 placeholder-slate-400 text-sm px-4 py-2.5 rounded-xl border border-transparent focus:border-[#1e3fae] outline-none transition"
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isLoading || isFrozen}
              className="p-2.5 bg-[#1e3fae] hover:bg-[#1e3fae]/90 text-white rounded-xl disabled:bg-slate-100 disabled:text-slate-400 transition cursor-pointer flex-shrink-0"
              title="Gửi tin nhắn"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </form>
        </div>
      )}

      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-gradient-to-tr from-[#1e3fae] to-blue-500 text-white rounded-full flex items-center justify-center shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer border-2 border-white/20 relative group"
        title="Trò chuyện với AI"
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <>
            <MessageSquare className="w-6 h-6" />
            <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white font-black text-[9px] px-1.5 py-0.5 rounded-full border border-white animate-pulse">
              AI
            </span>
          </>
        )}
      </button>
    </div>
  );
}
