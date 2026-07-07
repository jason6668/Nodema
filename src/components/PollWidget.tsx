import React, { useState } from 'react';
import { BarChart3, Plus, Trash2, Vote, X } from 'lucide-react';
import { LivePoll } from '../types';

interface PollWidgetProps {
  poll: LivePoll | null;
  isHost: boolean;
  onStartPoll: (question: string, options: string[]) => void;
  onVote: (optionIndex: number) => void;
  onEndPoll: () => void;
  onClose: () => void;
}

export default function PollWidget({
  poll,
  isHost,
  onStartPoll,
  onVote,
  onEndPoll,
  onClose,
}: PollWidgetProps) {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<string[]>(['在干嘛', '打算睡了']);
  const [userVotedIndex, setUserVotedIndex] = useState<number | null>(null);

  const handleAddOption = () => {
    if (options.length < 4) {
      setOptions([...options, '']);
    }
  };

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      const newOptions = options.filter((_, i) => i !== index);
      setOptions(newOptions);
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanOptions = options.map((opt) => opt.trim()).filter((opt) => opt !== '');
    if (question.trim() && cleanOptions.length >= 2) {
      onStartPoll(question.trim(), cleanOptions);
    }
  };

  return (
    <div className="bg-zinc-950/95 border border-white/10 rounded-2xl p-4 w-full max-w-sm mx-auto shadow-2xl backdrop-blur-xl text-white">
      <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-red-500" />
          <h3 className="font-bold text-sm">互动投票 (RED Poll)</h3>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition">
          <X className="w-4 h-4 text-zinc-400" />
        </button>
      </div>

      {!poll ? (
        // Creation UI (only available to Host or view placeholder for audience)
        isHost ? (
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="text-[11px] text-zinc-400 uppercase tracking-wider block mb-1">投票问题</label>
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="例如：大家觉得今晚播什么好？"
                className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-red-500 transition text-zinc-100"
                maxLength={40}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] text-zinc-400 uppercase tracking-wider block mb-1 flex justify-between items-center">
                <span>投票选项</span>
                {options.length < 4 && (
                  <button
                    type="button"
                    onClick={handleAddOption}
                    className="text-red-400 hover:text-red-300 flex items-center gap-0.5 text-[10px]"
                  >
                    <Plus className="w-3 h-3" /> 添加选项
                  </button>
                )}
              </label>

              {options.map((option, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    placeholder={`选项 ${index + 1}`}
                    className="flex-1 bg-zinc-900 border border-white/10 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-red-500 transition text-zinc-100"
                    maxLength={20}
                    required
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(index)}
                      className="p-2 hover:bg-red-500/10 text-zinc-400 hover:text-red-400 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-red-500 to-rose-600 hover:opacity-90 active:scale-[0.98] transition-all text-white font-semibold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 mt-4"
            >
              <Vote className="w-4 h-4" /> 发起投票
            </button>
          </form>
        ) : (
          <div className="py-8 text-center text-zinc-500 text-xs">
            主播目前没有发起投票。
          </div>
        )
      ) : (
        // Active/Result Poll UI
        <div className="space-y-4">
          <div className="bg-zinc-900/50 p-3 rounded-xl border border-white/5">
            <span className="text-[10px] text-red-400 font-semibold uppercase bg-red-500/10 px-1.5 py-0.5 rounded-md inline-block mb-1.5">
              {poll.isActive ? '投票中' : '投票已结束'}
            </span>
            <p className="text-sm font-semibold leading-relaxed text-zinc-100">{poll.question}</p>
          </div>

          <div className="space-y-2.5">
            {poll.options.map((option, idx) => {
              const percentage =
                poll.totalVotes > 0 ? Math.round((option.votes / poll.totalVotes) * 100) : 0;
              const hasVoted = userVotedIndex !== null;

              return (
                <div key={idx} className="relative overflow-hidden rounded-xl bg-zinc-900 border border-white/5 p-3">
                  {/* Background Percentage Bar */}
                  <div
                    className="absolute inset-y-0 left-0 bg-red-500/10 transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />

                  <div className="relative flex justify-between items-center text-xs">
                    <span className="font-medium text-zinc-200">{option.text}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-zinc-400 text-[10px]">{option.votes} 票</span>
                      <span className="font-bold text-red-400">{percentage}%</span>
                    </div>
                  </div>

                  {poll.isActive && !hasVoted && (
                    <button
                      onClick={() => {
                        setUserVotedIndex(idx);
                        onVote(idx);
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      title="点击投递此项"
                    />
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-2 border-t border-white/5">
            <span>总计: {poll.totalVotes} 票</span>
            {isHost && poll.isActive && (
              <button
                onClick={onEndPoll}
                className="text-red-400 hover:text-red-300 font-semibold border border-red-500/20 px-2.5 py-1 rounded-lg hover:bg-red-500/5 transition"
              >
                结束投票
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
