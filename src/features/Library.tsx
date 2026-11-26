import { useMemo, useState } from "react";
import {
  BookOpen,
  Brain,
  ChevronDown,
  ExternalLink,
  Leaf,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import "./library-insights.css";

type Topic = {
  id: string;
  title: string;
  category: "Chú ý" | "Học sâu" | "Phục hồi";
  meaning: string;
  why: string;
  action: string;
  caveat: string;
  evidence: string;
  source?: { title: string; url: string };
};
const topics: Topic[] = [
  {
    id: "K01",
    title: "“Brain rot” thực ra là gì?",
    category: "Chú ý",
    meaning:
      "Một cách nói đời thường về cảm giác đầu óc trì trệ hoặc khó tập trung. Đây không phải chẩn đoán y khoa.",
    why: "Cảm giác này có thể đi cùng căng thẳng, thiếu ngủ, kiệt sức hoặc những vấn đề khác. Gọi tên hành vi cụ thể sẽ hữu ích hơn tự gắn nhãn.",
    action:
      "Quan sát lúc nào mình mất tập trung và điều gì xảy ra trước đó. Ghi một điều có thể thay đổi.",
    caveat:
      "Các câu hỏi tự nhìn lại trong ReMind chỉ gợi mở suy nghĩ; không phải thang đo đã được kiểm định.",
    evidence: "Giải thích khái niệm",
  },
  {
    id: "K02",
    title: "Video ngắn & sự chú ý",
    category: "Chú ý",
    meaning:
      "Dùng video ngắn nhiều hơn có liên hệ với khả năng chú ý và kiểm soát xung động kém hơn trong một số nghiên cứu.",
    why: "Một tổng hợp năm 2025 gồm 71 nghiên cứu, 98.299 người tham gia ghi nhận mối liên hệ này. Bằng chứng cho các lĩnh vực nhận thức khác còn hạn chế.",
    action:
      "Giảm những lần lướt không có chủ đích; tắt thông báo không thiết yếu và dành một khoảng giải trí rõ ràng.",
    caveat:
      "Mối liên hệ không chứng minh nguyên nhân. Cách đo khác nhau và khả năng tác động hai chiều làm giới hạn kết luận.",
    evidence: "Tổng quan hệ thống · mối liên hệ",
    source: {
      title: "Psychological Bulletin, 2025",
      url: "https://doi.org/10.1037/bul0000498",
    },
  },
  {
    id: "K03",
    title: "Thiết kế môi trường số",
    category: "Chú ý",
    meaning:
      "Giảm tác nhân gây xao nhãng trước khi phải liên tục dùng ý chí để chống lại chúng.",
    why: "Một thử nghiệm ngẫu nhiên năm 2025 hạn chế Internet trên điện thoại trong hai tuần, vẫn giữ cuộc gọi, tin nhắn và Internet máy tính; kết quả gợi ý lợi ích với chú ý và sức khỏe tinh thần, với khác biệt giữa người tham gia.",
    action:
      "Để điện thoại ngoài tầm với khi tập trung. Dùng Focus Mode và giới hạn ứng dụng, vẫn giữ liên lạc cần thiết.",
    caveat:
      "Nghiên cứu không thử nghiệm ReMind hay chính xác các giới hạn trong ứng dụng. Không cần ngắt kết nối khẩn cấp hoặc công việc.",
    evidence: "Thử nghiệm ngẫu nhiên",
    source: {
      title: "PNAS Nexus, 2025",
      url: "https://doi.org/10.1093/pnasnexus/pgaf017",
    },
  },
  {
    id: "K04",
    title: "Tập trung sâu",
    category: "Chú ý",
    meaning:
      "Dành sự chú ý cho một nhiệm vụ đã xác định, với ít gián đoạn hơn.",
    why: "Một mục tiêu cụ thể giúp nhận ra khi mình đang chuyển việc. Thời lượng phù hợp quan trọng hơn cố ngồi thật lâu.",
    action:
      "Chọn một kết quả nhỏ, đóng các tab không liên quan, bắt đầu một phiên vừa sức và ghi lại gián đoạn thực tế.",
    caveat:
      "Lộ trình 15–60 phút là đề xuất thực hành của ứng dụng, không phải phác đồ đã được chứng minh lâm sàng. Nghỉ khi cần.",
    evidence: "Bài tập do ReMind thiết kế",
  },
  {
    id: "K05",
    title: "Nhớ lại trước khi xem lại",
    category: "Học sâu",
    meaning:
      "Retrieval Practice là tự gọi lại thông tin từ trí nhớ trước khi mở tài liệu.",
    why: "Việc truy xuất thông tin có thể củng cố học tập hiệu quả hơn chỉ đọc lại một cách thụ động.",
    action:
      "Đóng nguồn, viết những ý nhớ được, rồi mở lại để đối chiếu. Tự đánh giá số ý khớp với các ý tham chiếu.",
    caveat:
      "Kết quả phụ thuộc nội dung và cách thực hành. Điểm tự chấm trong app không phải phép đo trí nhớ lâm sàng.",
    evidence: "Tổng quan phương pháp học",
    source: {
      title: "Dunlosky và cộng sự, 2013",
      url: "https://doi.org/10.1177/1529100612453266",
    },
  },
  {
    id: "K06",
    title: "Ôn tập cách quãng",
    category: "Học sâu",
    meaning:
      "Spaced Practice chia các lần ôn thành nhiều ngày thay vì dồn hết vào một buổi.",
    why: "Những lần trở lại với kiến thức giúp luyện truy xuất trong các bối cảnh khác nhau.",
    action:
      "ReMind gợi ý ôn sau 1, 3, 7 và 14 ngày. Bắt đầu với tối đa ba lượt đến hạn mỗi ngày; có thể để lại khi quá tải.",
    caveat:
      "Khoảng cách tối ưu phụ thuộc tài liệu và kết quả của từng người. Các mốc trong app chỉ là mặc định thực hành.",
    evidence: "Tổng quan phương pháp học",
    source: {
      title: "Dunlosky và cộng sự, 2013",
      url: "https://doi.org/10.1177/1529100612453266",
    },
  },
  {
    id: "K07",
    title: "Đọc chậm, hiểu sâu",
    category: "Học sâu",
    meaning:
      "Đọc có mục đích, hạn chế đổi nguồn, rồi giải thích lại và kiểm tra hiểu biết.",
    why: "Một câu hỏi trước khi đọc giúp định hướng; lời giải thích sau khi đọc giúp thấy chỗ còn chưa rõ.",
    action:
      "Bắt đầu khoảng 10 phút. Đặt câu hỏi, đọc vừa sức, đóng tài liệu để nhớ lại rồi đối chiếu nguồn.",
    caveat:
      "Đây là bài tập của ứng dụng dựa trên nguyên tắc học tập; không có yêu cầu phải đọc nhanh. Chỉ thời gian thực sự đọc được tính vào mục tiêu đọc.",
    evidence: "Bài tập thực hành · nguyên tắc học",
    source: {
      title: "Dunlosky và cộng sự, 2013",
      url: "https://doi.org/10.1177/1529100612453266",
    },
  },
  {
    id: "K08",
    title: "Suy nghĩ trước khi hỏi AI",
    category: "Học sâu",
    meaning:
      "Giữ trách nhiệm với lập luận phức tạp, đồng thời dùng AI để hỗ trợ những phần phù hợp.",
    why: "Viết vấn đề, giả định và phương án trước giúp bạn đánh giá phản hồi thay vì chấp nhận kết luận có sẵn.",
    action:
      "Tự viết Problem, Constraints, Assumptions và Options; sau đó nhờ AI chất vấn giả định, tìm phản ví dụ hoặc cách kiểm chứng.",
    caveat:
      "ReMind không khẳng định AI luôn gây hại cho nhận thức. Dịch, định dạng và thao tác lặp lại có thể giao công cụ rồi kiểm tra.",
    evidence: "Bài tập do ReMind thiết kế",
  },
  {
    id: "K09",
    title: "Ngủ là một phần của kế hoạch",
    category: "Phục hồi",
    meaning: "Cả thời lượng lẫn chất lượng giấc ngủ đều quan trọng.",
    why: "CDC khuyến nghị người trưởng thành 18–60 tuổi ngủ ít nhất 7 giờ. Nhu cầu thay đổi theo tuổi và từng người.",
    action:
      "Giữ giờ ngủ, thức tương đối đều và dành đủ thời gian nghỉ. Không hy sinh giấc ngủ để hoàn thành checklist.",
    caveat:
      "Đây là hướng dẫn sức khỏe chung, không phải mục tiêu điều trị cá nhân. Khó ngủ kéo dài nên được đánh giá chuyên môn.",
    evidence: "Hướng dẫn sức khỏe chung",
    source: {
      title: "CDC · About Sleep",
      url: "https://www.cdc.gov/sleep/about/",
    },
  },
  {
    id: "K10",
    title: "Vận động theo sức mình",
    category: "Phục hồi",
    meaning: "Vận động đều đặn là một phần của chăm sóc sức khỏe tổng thể.",
    why: "WHO khuyến nghị người lớn 150–300 phút vận động vừa hoặc 75–150 phút vận động mạnh mỗi tuần, hay kết hợp tương đương, cùng tập sức mạnh ít nhất hai ngày khi phù hợp.",
    action:
      "Bắt đầu từ mức an toàn và tăng dần. Ghi riêng vận động nhẹ, vừa, mạnh và ngày tập sức mạnh.",
    caveat:
      "Đi bộ nhẹ không tự động được tính là vận động cường độ vừa. Điều chỉnh theo sức khỏe, khả năng và tư vấn chuyên môn khi cần.",
    evidence: "Hướng dẫn sức khỏe chung",
    source: {
      title: "WHO · Physical activity",
      url: "https://www.who.int/europe/news-room/fact-sheets/item/physical-activity",
    },
  },
  {
    id: "K11",
    title: "Một khoảng nghỉ không đầu vào",
    category: "Phục hồi",
    meaning:
      "Thử dừng lại trước khi mở ứng dụng gây xao nhãng, hoặc nghỉ mà không liên tục tiếp nhận nội dung.",
    why: "Khoảng dừng có thể giúp nhận ra nhu cầu thực sự: nghỉ ngơi, liên lạc hay tìm sự kích thích.",
    action:
      "Thử đi bộ ngắn không feed hoặc chờ một chút trước khi mở app. Hỏi: “Lúc này mình cần gì?”",
    caveat:
      "Đây là thử nghiệm hành vi, không phải cơ chế “reset dopamine”. Luôn giữ liên lạc và điều kiện an toàn cần thiết.",
    evidence: "Bài tập do ReMind thiết kế",
  },
  {
    id: "K12",
    title: "Khi nào nên tìm hỗ trợ?",
    category: "Phục hồi",
    meaning:
      "Ứng dụng hỗ trợ quan sát thói quen; không thay thế đánh giá chuyên môn.",
    why: "Khó nhớ, khó tập trung, thay đổi tâm trạng, giấc ngủ hoặc mệt mỏi kéo dài hay nặng dần có thể cần được tìm hiểu thêm.",
    action:
      "Nếu những vấn đề này ảnh hưởng sinh hoạt, hãy trao đổi với chuyên gia y tế. Lú lẫn nghiêm trọng đột ngột hoặc triệu chứng thần kinh mới cần chăm sóc khẩn cấp.",
    caveat:
      "Không dùng dữ liệu hoặc mức hoàn thành của ReMind để tự chẩn đoán hay trì hoãn chăm sóc cần thiết.",
    evidence: "Hướng dẫn an toàn",
  },
];

const guides = [
  {
    title: "Một phiên đọc có chủ đích",
    time: "30 phút gợi ý",
    icon: BookOpen,
    steps: [
      "2 phút: chọn tài liệu và một câu hỏi muốn trả lời.",
      "18 phút: đọc một nguồn, không chuyển việc.",
      "5 phút: đóng nguồn, viết lại ý chính.",
      "5 phút: đối chiếu, sửa điều chưa đúng. Chỉ 18 phút đọc được ghi vào mục tiêu đọc.",
    ],
  },
  {
    title: "Một lượt nhớ lại",
    time: "5–10 phút",
    icon: Brain,
    steps: [
      "Chọn thẻ đến hạn và chưa mở ý tham chiếu.",
      "Viết các ý nhớ được bằng lời của mình.",
      "Mở tham chiếu, tự chấm số ý khớp trên tổng số ý.",
      "Xem lại phần còn thiếu. Điểm này là tự đánh giá, không phải điểm sức khỏe.",
    ],
  },
  {
    title: "Tư duy độc lập",
    time: "Theo sức mình",
    icon: Sparkles,
    steps: [
      "Xác định vấn đề, ràng buộc và giả định.",
      "Đưa ra ít nhất hai phương án và các đánh đổi.",
      "Chọn quyết định cùng cách kiểm chứng.",
      "Nếu dùng AI, yêu cầu phản biện và tự kiểm tra lại. Không nhập dữ liệu công việc nhạy cảm.",
    ],
  },
];

export function Library() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Tất cả");
  const filtered = useMemo(
    () =>
      topics.filter(
        (topic) =>
          (category === "Tất cả" || topic.category === category) &&
          `${topic.title} ${topic.meaning} ${topic.action}`
            .toLocaleLowerCase("vi")
            .includes(query.trim().toLocaleLowerCase("vi")),
      ),
    [category, query],
  );
  return (
    <div className="stack library-page">
      <header className="page-header">
        <p className="eyebrow">HIỂU ĐỂ THỰC HÀNH</p>
        <h1>
          Một chút hiểu biết.
          <br />
          Một thay đổi nhỏ.
        </h1>
        <p className="muted">
          Đọc vừa đủ, rồi trở lại với cuộc sống. 12 ghi chú ngắn dành cho hành
          trình của bạn.
        </p>
      </header>
      <div className="library-search">
        <Search size={19} aria-hidden="true" />
        <Input
          aria-label="Tìm trong thư viện"
          placeholder="Tìm về tập trung, giấc ngủ, AI…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>
      <div
        className="library-filters"
        role="group"
        aria-label="Chủ đề thư viện"
      >
        {["Tất cả", "Chú ý", "Học sâu", "Phục hồi"].map((item) => (
          <Button
            key={item}
            variant={category === item ? "default" : "ghost"}
            size="sm"
            aria-pressed={category === item}
            onClick={() => setCategory(item)}
          >
            {item}
          </Button>
        ))}
      </div>
      <div className="library-topics">
        {filtered.map((topic) => (
          <details className="card knowledge-card" key={topic.id}>
            <summary>
              <span
                className={`knowledge-symbol ${topic.category === "Học sâu" ? "lavender" : topic.category === "Phục hồi" ? "peach" : ""}`}
              >
                {topic.category === "Học sâu" ? (
                  <Brain size={22} />
                ) : topic.category === "Phục hồi" ? (
                  <Leaf size={22} />
                ) : (
                  <BookOpen size={22} />
                )}
              </span>
              <span className="knowledge-summary">
                <small>{topic.category}</small>
                <h2>{topic.title}</h2>
                <p>{topic.meaning}</p>
              </span>
              <ChevronDown
                className="knowledge-chevron"
                size={18}
                aria-hidden="true"
              />
            </summary>
            <div className="knowledge-details">
              <h3>Vì sao đáng quan tâm</h3>
              <p>{topic.why}</p>
              <h3>Một việc để thử</h3>
              <p>{topic.action}</p>
              <div className="knowledge-caveat">
                <ShieldCheck size={18} aria-hidden="true" />
                <p>{topic.caveat}</p>
              </div>
              <span className="evidence-label">{topic.evidence}</span>
              {topic.source && (
                <a
                  className="evidence-link"
                  href={topic.source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {topic.source.title}
                  <ExternalLink size={14} aria-hidden="true" />
                  <span className="sr-only"> (mở tab mới)</span>
                </a>
              )}
            </div>
          </details>
        ))}
      </div>
      {filtered.length === 0 && (
        <div className="card empty-state">
          <BookOpen size={28} />
          <h2>Chưa thấy chủ đề phù hợp</h2>
          <p className="muted">Thử một từ ngắn hơn hoặc chọn “Tất cả”.</p>
          <Button
            variant="outline"
            onClick={() => {
              setQuery("");
              setCategory("Tất cả");
            }}
          >
            Xem tất cả ghi chú
          </Button>
        </div>
      )}
      <section className="stack">
        <div className="section-heading">
          <div>
            <p className="eyebrow">ĐEM VÀO THỰC TẾ</p>
            <h2>Ba bài tập nhỏ</h2>
          </div>
        </div>
        <div className="exercise-grid">
          {guides.map((guide) => (
            <article className="card exercise-guide" key={guide.title}>
              <guide.icon size={25} aria-hidden="true" />
              <span className="badge">{guide.time}</span>
              <h3>{guide.title}</h3>
              <ol>
                {guide.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </article>
          ))}
        </div>
      </section>
      <section className="card ai-policy">
        <div className="section-heading">
          <div>
            <p className="eyebrow">AI LÀ NGƯỜI PHẢN BIỆN</p>
            <h2>Bạn vẫn giữ tay lái.</h2>
          </div>
          <Sparkles size={30} aria-hidden="true" />
        </div>
        <p>
          Giao AI việc dịch, định dạng và boilerplate khi phù hợp, rồi kiểm tra
          kết quả. Với kiến thức mới, kiến trúc, lỗi khó và quyết định lớn, hãy
          viết suy nghĩ của mình trước.
        </p>
        <div className="ai-prompt-list">
          <blockquote>
            “Hãy chất vấn các giả định trong phương án này.”
          </blockquote>
          <blockquote>
            “Tìm phản ví dụ và những cách phương án có thể thất bại.”
          </blockquote>
          <blockquote>
            “Tôi có thể kiểm chứng kết luận này bằng cách nào?”
          </blockquote>
        </div>
        <p className="muted">
          ReMind không có chatbot và không tự gửi ghi chú ra ngoài. Nếu sao chép
          sang công cụ khác, chỉ dùng nội dung bạn được phép chia sẻ.
        </p>
      </section>
      <p className="library-footnote muted">
        Các nguồn nói về bằng chứng hoặc hướng dẫn chung, không chứng minh hiệu
        quả của ReMind.{" "}
        <a
          href="https://doi.org/10.1136/bmjph-2025-004086"
          target="_blank"
          rel="noopener noreferrer"
        >
          Đọc thêm về giới hạn bằng chứng video ngắn (2026)
          <span className="sr-only">, mở tab mới</span>.
        </a>
      </p>
    </div>
  );
}
