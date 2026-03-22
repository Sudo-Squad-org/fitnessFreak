import { api } from "./api";

export const communityService = {
  // Buddy Profile
  createProfile:    (d)      => api.post("/community/buddy/profile", d),
  getMyProfile:     ()       => api.get("/community/buddy/profile"),
  updateProfile:    (d)      => api.patch("/community/buddy/profile", d),
  deleteProfile:    ()       => api.delete("/community/buddy/profile"),
  // Matching
  getMatches:       ()       => api.get("/community/buddy/matches"),
  sendRequest:      (alias)  => api.post(`/community/buddy/request/${encodeURIComponent(alias)}`),
  getRequests:      ()       => api.get("/community/buddy/requests"),
  acceptRequest:    (id)     => api.post(`/community/buddy/requests/${id}/accept`),
  declineRequest:   (id)     => api.delete(`/community/buddy/requests/${id}`),
  // Pair
  getMyPair:        ()       => api.get("/community/buddy/pair"),
  dissolvePair:     ()       => api.delete("/community/buddy/pair"),
  // Check-ins
  getCheckins:      ()            => api.get("/community/buddy/checkins"),
  respondCheckin:   (id, d)       => api.post(`/community/buddy/checkins/${id}/respond`, d),
  // Messages
  getMessages:      (p)           => api.get("/community/buddy/messages", { params: p }),
  sendMessage:      (d)           => api.post("/community/buddy/messages", d),
  // Dares
  getDare:          ()            => api.get("/community/buddy/dare"),
  createDare:       (d)           => api.post("/community/buddy/dare", d),
  acceptDare:       (id)          => api.patch(`/community/buddy/dare/${id}/accept`),
  completeDare:     (id)          => api.patch(`/community/buddy/dare/${id}/complete`),
  // Reactions
  reactToMilestone: (d)           => api.post("/community/buddy/reactions", d),
  // Pulse & Wrap
  getPartnerPulse:  ()            => api.get("/community/buddy/partner-pulse"),
  getWeeklyWrap:    ()            => api.get("/community/buddy/weekly-wrap"),
  // Challenges
  listChallenges:   (p)      => api.get("/community/challenges", { params: p }),
  getChallenge:     (id)     => api.get(`/community/challenges/${id}`),
  createChallenge:  (d)      => api.post("/community/challenges", d),
  updateChallenge:  (id, d)  => api.patch(`/community/challenges/${id}`, d),
  deleteChallenge:  (id)     => api.delete(`/community/challenges/${id}`),
  joinChallenge:    (id, d)  => api.post(`/community/challenges/${id}/join`, d),
  leaveChallenge:   (id)     => api.delete(`/community/challenges/${id}/leave`),
  getLeaderboard:   (id)     => api.get(`/community/challenges/${id}/leaderboard`),
  updateProgress:   (id, d)  => api.patch(`/community/challenges/${id}/progress`, d),
  // Feed
  getFeedOptIn:     ()       => api.get("/community/feed/opt-in"),
  optInFeed:        (d)      => api.post("/community/feed/opt-in", d),
  optOutFeed:       ()       => api.delete("/community/feed/opt-in"),
  getFeed:          (p)      => api.get("/community/feed", { params: p }),
  createPost:       (d)      => api.post("/community/feed/posts", d),
  deletePost:       (id)     => api.delete(`/community/feed/posts/${id}`),
  toggleReaction:   (id)     => api.post(`/community/feed/posts/${id}/react`),
  getReactionCount: (id)     => api.get(`/community/feed/posts/${id}/reaction-count`),
  getComments:      (id)     => api.get(`/community/feed/posts/${id}/comments`),
  addComment:       (id, d)  => api.post(`/community/feed/posts/${id}/comments`, d),
  deleteComment:    (id)     => api.delete(`/community/feed/comments/${id}`),
  // Content
  listContent:      (p)      => api.get("/community/content", { params: p }),
  getContent:       (id)     => api.get(`/community/content/${id}`),
  createContent:    (d)      => api.post("/community/content", d),
  updateContent:    (id, d)  => api.patch(`/community/content/${id}`, d),
  publishContent:   (id)     => api.post(`/community/content/${id}/publish`),
  rateContent:      (id, d)  => api.post(`/community/content/${id}/rate`, d),
  getContentRating: (id)     => api.get(`/community/content/${id}/rating`),
};
