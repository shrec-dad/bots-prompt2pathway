const Event = require('../models/eventModel');

const computeMetrics = async (req, res) => {
  try {
    const key = req.params.key;

    const pipeline = [];

    // Conditionally add $match stage if key exists
    if (key) {
      pipeline.push({ $match: { key } });
    }

    pipeline.push(
      {
        $addFields: {
          hour: { $hour: { $toDate: "$ts" } },
        },
      },
      {
        $group: {
          _id: null,
          conversations: {
            $sum: {
              $cond: [
                { $in: ["$type", ["open_widget", "widget.conversation_started"]] },
                1,
                0,
              ],
            },
          },
          leads: {
            $sum: {
              $cond: [
                { $in: ["$type", ["widget.lead_captured", "preview.lead_captured"]] },
                1,
                0,
              ],
            },
          },
          appointments: {
            $sum: { $cond: [{ $eq: ["$type", "widget.appointment_booked"] }, 1, 0] },
          },
          qualifiedLeads: {
            $sum: { $cond: [{ $eq: ["$meta.qualified", true] }, 1, 0] },
          },
          drops: {
            $sum: { $cond: [{ $eq: ["$type", "widget.dropoff"] }, 1, 0] },
          },
          handoffs: {
            $sum: { $cond: [{ $eq: ["$type", "widget.handoff_to_human"] }, 1, 0] },
          },
          responseTimes: {
            $push: { $cond: [{ $eq: ["$type", "widget.response_time"] }, "$meta.secs", null] },
          },
          convoDurations: {
            $push: { $cond: [{ $eq: ["$type", "widget.conversation_length"] }, "$meta.secs", null] },
          },
          hours: { $push: "$hour" },
        },
      },
      {
        $project: {
          conversations: 1,
          leads: 1,
          appointments: 1,
          qualifiedLeads: 1,
          drops: 1,
          handoffs: 1,
          avgResponseSecs: {
            $avg: {
              $filter: {
                input: "$responseTimes",
                as: "r",
                cond: { $ne: ["$$r", null] },
              },
            },
          },
          avgConversationSecs: {
            $avg: {
              $filter: {
                input: "$convoDurations",
                as: "c",
                cond: { $ne: ["$$c", null] },
              },
            },
          },
          hours: 1,
        },
      }
    )

    const defaultMetrics = {
      conversations: 0,
      leads: 0,
      appointments: 0,
      csatPct: 0,  // CSAT placeholder: if you emit csat events, compute true avg; else keep as 0
      avgResponseSecs: 0,
      conversionPct: 0,
      dropoffPct: 0,
      qualifiedLeads: 0,
      avgConversationSecs: 0,
      handoffRatePct: 0,
      peakChatTime: "—",
    };

    // Aggregate key metrics
    const result = await Event.aggregate(pipeline);
    if (!result || !result[0]) {
        res.json(defaultMetrics);
        return;
    }

    const data = result[0];
  
    const totalTouches = data.conversations || 1;

    // Peak hour calculation
    const hourCounts = {};
    (data.hours || []).forEach((h) => {
      hourCounts[h] = (hourCounts[h] || 0) + 1;
    });
    let peakChatTime = "—";
    const topHour = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0];
    if (topHour) {
      const h = Number(topHour[0]);
      const pad = (n) => String(n).padStart(2, "0");
      peakChatTime = `${pad(h)}–${pad((h + 1) % 24)}`;
    }

    const metrics = {
      conversations: data.conversations,
      leads: data.leads,
      appointments: data.appointments,
      csatPct: 0, // placeholder
      avgResponseSecs: Math.round((data.avgResponseSecs || 0) * 10) / 10,
      conversionPct: Math.round(((data.leads + data.appointments) / totalTouches) * 1000) / 10,
      dropoffPct: Math.round((data.drops / totalTouches) * 1000) / 10,
      qualifiedLeads: data.qualifiedLeads,
      avgConversationSecs: Math.round((data.avgConversationSecs || 0) * 10) / 10,
      handoffRatePct: Math.round((data.handoffs / totalTouches) * 1000) / 10,
      peakChatTime,
    }

    res.json(metrics);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

const trackEvent = async (req, res) => {
  try {
    const newEvent = new Event(req.body);
    const savedEvent = await newEvent.save();
    res.status(201).json(savedEvent);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const resetMetrics = async (req, res) => {
  try {
    const key = req.params.key;

    if (key) {
      await Event.deleteMany({ key });
    } else {
      await Event.deleteMany({});
    }

    res.json({ message: "Metrics reset" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

module.exports = { computeMetrics, trackEvent, resetMetrics };
