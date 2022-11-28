interface CampaignAttributes {
  created_at: Date;
  creation_count: number;
  creation_name: string;
  discord_server_id?: any;
  display_patron_goals: boolean;
  earnings_visibility: string;
  image_small_url?: any;
  image_url?: any;
  is_charged_immediately: boolean;
  is_monthly: boolean;
  is_nsfw: boolean;
  is_plural: boolean;
  main_video_embed?: any;
  main_video_url?: any;
  one_liner?: any;
  outstanding_payment_amount_cents: number;
  patron_count: number;
  pay_per_name?: any;
  pledge_sum: number;
  pledge_url: string;
  published_at: Date;
  summary?: any;
  thanks_embed?: any;
  thanks_msg?: any;
  thanks_video_url?: any;
}

interface CampaignData {
  id: string;
  type: string;
}

interface CampaignLinks {
  related: string;
}

interface CampaignCreator {
  data: CampaignData;
  links: CampaignLinks;
}

interface CampaignGoals {
  data: any[];
}

interface CampaignDatum2 {
  id: string;
  type: string;
}

interface CampaignRewards {
  data: CampaignDatum2[];
}

interface CampaignRelationships {
  creator: CampaignCreator;
  goals: CampaignGoals;
  rewards: CampaignRewards;
}

interface CampaignDatum {
  attributes: CampaignAttributes;
  id: string;
  relationships: CampaignRelationships;
  type: string;
}

interface CampaignSocialConnections {
  deviantart?: any;
  discord?: any;
  facebook?: any;
  reddit?: any;
  spotify?: any;
  twitch?: any;
  twitter?: any;
  youtube?: any;
}

interface CampaignAttributes2 {
  about?: any;
  created: Date;
  discord_id?: any;
  email: string;
  facebook?: any;
  facebook_id?: any;
  first_name: string;
  full_name: string;
  gender: number;
  has_password: boolean;
  image_url: string;
  is_deleted: boolean;
  is_email_verified: boolean;
  is_nuked: boolean;
  is_suspended: boolean;
  last_name: string;
  social_connections: CampaignSocialConnections;
  thumb_url: string;
  twitch?: any;
  twitter?: any;
  url: string;
  vanity: string;
  youtube?: any;
  amount?: number;
  amount_cents?: number;
  created_at?: any;
  description: string;
  id: string;
  remaining?: number;
  requires_shipping?: boolean;
  type: string;
  user_limit?: any;
}

interface CampaignData2 {
  id: string;
  type: string;
}

interface CampaignLinks2 {
  related: string;
}

interface CampaignCampaign {
  data: CampaignData2;
  links: CampaignLinks2;
}

interface CampaignData3 {
  id: string;
  type: string;
}

interface CampaignLinks3 {
  related: string;
}

interface CampaignCreator2 {
  data: CampaignData3;
  links: CampaignLinks3;
}

interface CampaignRelationships2 {
  campaign: CampaignCampaign;
  creator: CampaignCreator2;
}

interface CampaignIncluded {
  attributes: CampaignAttributes2;
  id: string;
  relationships: CampaignRelationships2;
  type: string;
}

interface CreatorCampaign {
  data: CampaignDatum[];
  included: CampaignIncluded[];
}

interface Patrons {
  data: PatronDaum[];
  included: PatronIncluded[];
  links?: PatronLinks3;
  meta?: PatronMeta;
}

interface PatronDaum {
  attributes: PatronAttributes;
  id: string;
  relationships: PatronRelationships;
  type: string;
}

interface PatronAttributes {
  amount_cents: number;
  created_at: string;
  declined_since: any;
  patron_pays_fees: boolean;
  pledge_cap_cents: any;
}

interface PatronRelationships {
  patron: PatronPatron;
  reward: PatronReward;
}

interface PatronPatron {
  data: PatronData;
  links: PatronLinks;
}

interface PatronData {
  id: string;
  type: string;
}

interface PatronLinks {
  related: string;
}

interface PatronReward {
  data: PatronData2;
  links: PatronLinks2;
}

interface PatronData2 {
  id: string;
  type: string;
}

interface PatronLinks2 {
  related: string;
}

interface PatronIncluded {
  attributes: PatronAttributes2;
  id: string;
  type: string;
}

interface PatronAttributes2 {
  about?: string;
  created?: string;
  email?: string;
  facebook: any;
  first_name?: string;
  full_name?: string;
  gender?: number;
  image_url?: string;
  is_email_verified?: boolean;
  last_name?: string;
  social_connections?: PatronSocialConnections;
  thumb_url?: string;
  twitch: any;
  twitter?: string;
  url: string;
  vanity?: string;
  youtube: any;
  amount_cents?: number;
  created_at?: string;
  description?: string;
  discord_role_ids: any;
  edited_at?: string;
  patron_count?: number;
  post_count: any;
  published?: boolean;
  published_at?: string;
  remaining: any;
  requires_shipping?: boolean;
  title?: string;
  unpublished_at: any;
  user_limit: any;
}

interface PatronSocialConnections {
  deviantart: any;
  discord: any;
  facebook: any;
  reddit: any;
  spotify: any;
  twitch: any;
  twitter: any;
  youtube: any;
}

interface PatronLinks3 {
  first: string;
  next: string;
}

interface PatronMeta {
  count: number;
}
