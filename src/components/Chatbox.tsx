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
  TrendingUp,
  HelpCircle,
  Building2,
  Briefcase
} from "lucide-react";
import { chatService } from "../services/chat.service";
import { useAuthStore } from "../stores/authStore";

// ──────────────────────────────────────────────────────────
// Types – khớp với từng template trong chat_response_templates.md
// ──────────────────────────────────────────────────────────

/** Item dùng cho Template 0 (job list) và Template 3 (CV vs Job scoring) */
interface ListItem {
  id?: string;
  /** Template 0 – mô tả ngắn cho từng job */
  message?: string;
  /** Template 0 */
  title?: string;
  company?: string;
  description?: string;
  salary?: string;
  location?: string;
  /** Template 3 – CV vs Job */
  score?: number;
  reasoning?: string;
  suggestions?: string;
}

type TemplateIndex = 0 | 2 | 3 | 4 | 6;

interface MessageUI {
  sender: "user" | "ai";
  /** templateIndex từ field `message` của response (0 / 2 / 3 / 4 / 6), undefined = user message */
  templateIndex?: TemplateIndex;
  /** Văn bản hiển thị trong bubble chính */
  text: string;
  /** Template 0 / 3 / 4 */
  list?: ListItem[];
  /** Template 6 – câu hỏi làm rõ */
  refinedQuestion?: string;
  createdAt?: Date;
}

// ──────────────────────────────────────────────────────────
// Helper – parse raw answer object → MessageUI fields
// ──────────────────────────────────────────────────────────
function parseAIResponse(
  templateIndex: number | string,
  data: Record<string, unknown>
): Pick<MessageUI, "templateIndex" | "text" | "list" | "refinedQuestion"> {
  const idx = Number(templateIndex) as TemplateIndex;

  switch (idx) {
    case 0:
    case 3:
      return {
        templateIndex: idx,
        text: (data.message as string) || "Đây là kết quả tôi tìm thấy:",
        list: Array.isArray(data.list) ? (data.list as ListItem[]) : undefined,
      };
    case 2:
      return {
        templateIndex: 2,
        text: (data.message as string) || "Xin chào! Tôi có thể giúp gì cho bạn?",
      };
    case 4:
      return {
        templateIndex: 4,
        text: (data.message as string) || "Đây là thông tin bạn cần:",
        list: Array.isArray(data.list) ? (data.list as ListItem[]) : undefined,
      };
    case 6:
      return {
        templateIndex: 6,
        text: "Bạn có thể cung cấp thêm thông tin để tôi hỗ trợ chính xác hơn không?",
        refinedQuestion: (data.refined_question as string) || "",
      };
    default:
      return {
        text: (data.message as string) || "Đã có phản hồi từ AI.",
        list: Array.isArray(data.list) ? (data.list as ListItem[]) : undefined,
      };
  }
}

// ──────────────────────────────────────────────────────────
// Sub-components
// ──────────────────────────────────────────────────────────

/** Template 0 – một job card trong list tìm kiếm / so sánh */
function JobCard({ job, onClose }: { job: ListItem; onClose: () => void }) {
  return (
    <div className="bg-white border border-slate-200/80 rounded-xl p-3 shadow-sm hover:border-[#1e3fae]/40 hover:shadow-md transition-all flex flex-col gap-2">
      {/* Tiêu đề & công ty */}
      <div>
        <h4 className="font-bold text-slate-900 text-sm hover:text-[#1e3fae] transition-colors line-clamp-1">
          {job.title}
        </h4>
        {job.company && (
          <p className="flex items-center gap-1 text-xs text-slate-500 font-semibold mt-0.5">
            <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
            {job.company}
          </p>
        )}
      </div>

      {/* Địa điểm & lương */}
      {(job.location || job.salary) && (
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-600">
          {job.location && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-slate-400" />
              {job.location}
            </span>
          )}
          {job.salary && (
            <span className="flex items-center gap-1 font-medium text-blue-600">
              <DollarSign className="w-3 h-3 text-blue-400" />
              {job.salary}
            </span>
          )}
        </div>
      )}

      {/* Mô tả ngắn từ AI (field message trong item) */}
      {job.message && (
        <p className="text-xs text-slate-600 italic leading-relaxed line-clamp-2">
          {job.message}
        </p>
      )}

      {job.id && (
        <Link
          to={`/candidate/jobs/${job.id}`}
          onClick={onClose}
          className="mt-1 flex items-center justify-center gap-1 py-1.5 px-3 bg-[#1e3fae]/5 hover:bg-[#1e3fae]/10 text-[#1e3fae] rounded-lg text-xs font-bold transition"
        >
          Xem chi tiết công việc
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      )}
    </div>
  );
}

/** Template 3 – card đánh giá CV vs Job */
function ScoreCard({ job, onClose }: { job: ListItem; onClose: () => void }) {
  return (
    <div className="bg-white border border-slate-200/80 rounded-xl p-3 shadow-sm hover:border-emerald-300 transition-all flex flex-col gap-2">
      {/* Score badge */}
      {job.score !== undefined && (
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Độ phù hợp
          </span>
          <span
            className={`flex items-center gap-1 text-xs font-extrabold px-2 py-0.5 rounded-full ${
              job.score >= 7
                ? "text-emerald-600 bg-emerald-50"
                : job.score >= 4
                ? "text-amber-600 bg-amber-50"
                : "text-rose-600 bg-rose-50"
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            {job.score}/10
          </span>
        </div>
      )}

      <div>
        <h4 className="font-bold text-slate-900 text-sm line-clamp-1">{job.title}</h4>
      </div>

      {job.reasoning && (
        <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 italic">
          <strong>Lý do:</strong> {job.reasoning}
        </p>
      )}

      {job.suggestions && (
        <p className="text-xs text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-100">
          <strong>Gợi ý cải thiện:</strong> {job.suggestions}
        </p>
      )}

      {job.id && (
        <Link
          to={`/candidate/jobs/${job.id}`}
          onClick={onClose}
          className="mt-1 flex items-center justify-center gap-1 py-1.5 px-3 bg-[#1e3fae]/5 hover:bg-[#1e3fae]/10 text-[#1e3fae] rounded-lg text-xs font-bold transition"
        >
          Xem vị trí này
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      )}
    </div>
  );
}

/** Template 4 – card thông tin company / job (chỉ có id + message) */
function ResearchCard({ item }: { item: ListItem }) {
  return (
    <div className="bg-white border border-slate-200/80 rounded-xl p-3 shadow-sm flex flex-col gap-1.5">
      <div className="flex items-start gap-2">
        <Briefcase className="w-3.5 h-3.5 text-[#1e3fae] shrink-0 mt-0.5" />
        <p className="text-xs text-slate-700 leading-relaxed">{item.message}</p>
      </div>
    </div>
  );
}

/** Template 6 – hiển thị câu hỏi làm rõ */
function ClarificationCard({ question }: { question: string }) {
  return (
    <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 mt-1">
      <HelpCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
      <p className="text-xs text-amber-800 leading-relaxed">{question}</p>
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// Main Chatbox component
// ──────────────────────────────────────────────────────────
export default function Chatbox() {
  const { isAuthenticated, user } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<MessageUI[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFrozen, setIsFrozen] = useState(false);

  // Khi isFrozen=true: phiên chat > 24h → cho phép bắt đầu cuộc trò chuyện mới
  const handleStartNewChat = () => {
    setIsFrozen(false);
    setMessages([{
      sender: "ai",
      templateIndex: 2,
      text: "Xin chào trở lại! 👋 Tôi là Trợ lý ảo AI của RecruitHub. Phiên chat mới đã bắt đầu — tôi có thể giúp gì cho bạn hôm nay?",
      createdAt: new Date(),
    }]);
  };

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Quick suggestions
  const suggestions = [
    { label: "🔍 Tìm việc NodeJS", query: "Tìm kiếm công việc NodeJS" },
    { label: "📄 Gợi ý việc từ CV", query: "Gợi ý việc làm phù hợp với CV của tôi" },
    { label: "⚖️ Đánh giá CV vs Job", query: "So sánh CV của tôi với một công việc bất kỳ" },
    { label: "🏢 Hỏi về công ty", query: "Hãy giới thiệu một số công ty nổi bật" },
  ];

  // ── Load history ──────────────────────────────────────────
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

          // History is desc (newest first) – reverse to show chronologically
          const sortedHistory = [...response.data.history].reverse();

          sortedHistory.forEach((item: {
            question: string;
            answer?: string;
            template?: number | string;
            createdAt?: string;
          }) => {
            // User message
            historyList.push({
              sender: "user",
              text: item.question,
              createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
            });

            // AI response
            let aiMsg: Pick<MessageUI, "templateIndex" | "text" | "list" | "refinedQuestion"> = {
              text: "Đã có phản hồi từ AI.",
            };

            try {
              if (item.answer) {
                const parsed: Record<string, unknown> = JSON.parse(item.answer);
                aiMsg = parseAIResponse(item.template ?? -1, parsed);
              } else {
                aiMsg = { text: String(item.template ?? "Đã có phản hồi từ AI.") };
              }
            } catch {
              aiMsg = { text: item.answer || String(item.template ?? "") };
            }

            historyList.push({
              sender: "ai",
              ...aiMsg,
              createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
            });
          });

          if (historyList.length === 0) {
            historyList.push({
              sender: "ai",
              templateIndex: 2,
              text: "Xin chào! Tôi là Trợ lý ảo JobConnect. Tôi có thể giúp gì cho bạn hôm nay?",
            });
          }

          setMessages(historyList);
        }
      } catch (err) {
        console.error("Lỗi khi tải lịch sử chat:", err);
        setMessages([
          {
            sender: "ai",
            templateIndex: 2,
            text: "Xin chào! Tôi là Trợ lý ảo JobConnect. Tôi có thể giúp gì cho bạn hôm nay?",
          },
        ]);
      }
    };

    fetchHistory();
  }, [isAuthenticated, user?.id]);

  // ── Auto-scroll ───────────────────────────────────────────
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  // ── Send message ──────────────────────────────────────────
  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const userText = textToSend.trim();
    setInputValue("");
    setMessages((prev) => [...prev, { sender: "user", text: userText }]);
    setIsLoading(true);

    try {
      const response = await chatService.sendMessage(userText);

      let aiMsg: Pick<MessageUI, "templateIndex" | "text" | "list" | "refinedQuestion">;

      if (response.type === "SUCCESS" && response.data) {
        // response.message contains the templateIndex (0/2/3/4/6)
        aiMsg = parseAIResponse(response.message, response.data as Record<string, unknown>);
      } else {
        // FAILED response
        aiMsg = {
          text: String(response.message) || "Xin lỗi, đã xảy ra lỗi trong quá trình xử lý.",
        };
      }

      setMessages((prev) => [
        ...prev,
        { sender: "ai", ...aiMsg, createdAt: new Date() },
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
        { sender: "ai", text: errMsg, createdAt: new Date() },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Render list theo templateIndex ────────────────────────
  const renderList = (msg: MessageUI) => {
    if (!msg.list || msg.list.length === 0) return null;

    return (
      <div className="mt-2.5 space-y-2.5 w-full">
        {msg.list.map((item, idx) => {
          if (msg.templateIndex === 3) {
            return <ScoreCard key={idx} job={item} onClose={() => setIsOpen(false)} />;
          }
          if (msg.templateIndex === 4) {
            return <ResearchCard key={idx} item={item} />;
          }
          // Template 0 (default)
          return <JobCard key={idx} job={item} onClose={() => setIsOpen(false)} />;
        })}
      </div>
    );
  };

  // ── JSX ───────────────────────────────────────────────────
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
                  {isFrozen ? (
                    <>
                      <span className="w-2 h-2 bg-amber-400 rounded-full" />
                      <span className="text-[11px] text-amber-200 font-medium">Phiên đã hết hạn</span>
                    </>
                  ) : (
                    <>
                      <span className="w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
                      <span className="text-[11px] text-blue-100 font-medium">Đang hoạt động</span>
                    </>
                  )}
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

                {/* Bubble + list content */}
                <div className="max-w-[80%] flex flex-col">
                  {/* Main text bubble */}
                  <div
                    className={`px-4 py-2.5 rounded-2xl text-[14px] leading-relaxed shadow-sm ${
                      msg.sender === "user"
                        ? "bg-[#1e3fae] text-white rounded-br-none"
                        : "bg-white text-slate-800 border border-slate-100 rounded-bl-none"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  </div>

                  {/* Template 6 – clarification card */}
                  {msg.templateIndex === 6 && msg.refinedQuestion && (
                    <ClarificationCard question={msg.refinedQuestion} />
                  )}

                  {/* Template 0 / 3 / 4 – list cards */}
                  {renderList(msg)}

                  {/* Timestamp */}
                  {msg.createdAt && (
                    <span
                      className={`text-[10px] text-slate-400 mt-1 ${
                        msg.sender === "user" ? "text-right" : "text-left"
                      }`}
                    >
                      {msg.createdAt.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
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

            {/* AI Typing indicator */}
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#1e3fae] to-blue-500 flex items-center justify-center text-white flex-shrink-0 shadow-sm">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-white border border-slate-100 px-4 py-3 rounded-2xl rounded-bl-none shadow-sm flex items-center gap-1.5">
                  <span
                    className="w-1.5 h-1.5 bg-[#1e3fae] rounded-full animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  ></span>
                  <span
                    className="w-1.5 h-1.5 bg-[#1e3fae] rounded-full animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  ></span>
                  <span
                    className="w-1.5 h-1.5 bg-[#1e3fae] rounded-full animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  ></span>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Quick suggestions — chỉ hiện khi session còn active */}
          {messages.length <= 2 && !isLoading && !isFrozen && (
            <div className="px-4 py-2 bg-slate-50 border-t border-slate-100">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Gợi ý câu hỏi
              </p>
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

          {/* ── Frozen State: Phiên hết hạn → Bắt đầu mới ── */}
          {isFrozen ? (
            <div className="p-4 bg-white border-t border-slate-200">
              <div className="flex flex-col items-center gap-3 py-2">
                {/* Icon */}
                <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center">
                  <span className="text-2xl">⏰</span>
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-slate-700">Phiên chat đã hết hạn</p>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                    Lịch sử trò chuyện của bạn đã quá 24h.{"\n"}Bắt đầu phiên mới để tiếp tục.
                  </p>
                </div>
                <button
                  onClick={handleStartNewChat}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#1e3fae] to-blue-500 hover:from-[#1e3fae]/90 hover:to-blue-500/90 text-white font-bold text-sm py-3 rounded-xl shadow-md hover:shadow-lg transition-all active:scale-[0.98]"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  Bắt đầu cuộc trò chuyện mới
                </button>
              </div>
            </div>
          ) : (
          /* ── Normal Input Area ── */
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
              placeholder="Nhập câu hỏi tại đây..."
              disabled={isLoading}
              className="flex-1 bg-slate-100 hover:bg-slate-100/80 focus:bg-white text-slate-800 placeholder-slate-400 text-sm px-4 py-2.5 rounded-xl border border-transparent focus:border-[#1e3fae] outline-none transition"
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              className="p-2.5 bg-[#1e3fae] hover:bg-[#1e3fae]/90 text-white rounded-xl disabled:bg-slate-100 disabled:text-slate-400 transition cursor-pointer flex-shrink-0"
              title="Gửi tin nhắn"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </form>
          )}
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
