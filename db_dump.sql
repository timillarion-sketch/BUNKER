--
-- PostgreSQL database cluster dump
--

\restrict 78ypQ5WTaSfv01IpuvkYb4MGcfEc5iQMFk4bfIfSipTdYnAkxgfmoMz4BVrfsWb

SET default_transaction_read_only = off;

SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;

--
-- Roles
--

CREATE ROLE bunker_user;
ALTER ROLE bunker_user WITH SUPERUSER INHERIT CREATEROLE CREATEDB LOGIN REPLICATION BYPASSRLS PASSWORD 'SCRAM-SHA-256$4096:gDl+jwmvZExmSgKeAthGLQ==$AI7IttOTNLuZkojqd5Ts2gYWHBW6x3dRQF4xdGy9wbo=:Ragl1oZBSNDqJPdg1rowiKQP4yD3ge0AcBVZXenXRns=';

--
-- User Configurations
--








\unrestrict 78ypQ5WTaSfv01IpuvkYb4MGcfEc5iQMFk4bfIfSipTdYnAkxgfmoMz4BVrfsWb

--
-- Databases
--

--
-- Database "template1" dump
--

\connect template1

--
-- PostgreSQL database dump
--

\restrict BIAHd7mxJaCstfF5Y8Yr7WGgkDSRRSnmvdh1hTmrCDhfGv82yltJpc0hzJCfI0u

-- Dumped from database version 16.14
-- Dumped by pg_dump version 16.14

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- PostgreSQL database dump complete
--

\unrestrict BIAHd7mxJaCstfF5Y8Yr7WGgkDSRRSnmvdh1hTmrCDhfGv82yltJpc0hzJCfI0u

--
-- Database "bunker_db" dump
--

--
-- PostgreSQL database dump
--

\restrict anmP9OXgOvJkVcy98EO6q1q4KI9uRzXVQ0lmSyU8OqFtti0Rp5cH7Qagn59HHEr

-- Dumped from database version 16.14
-- Dumped by pg_dump version 16.14

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: bunker_db; Type: DATABASE; Schema: -; Owner: bunker_user
--

CREATE DATABASE bunker_db WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'en_US.utf8';


ALTER DATABASE bunker_db OWNER TO bunker_user;

\unrestrict anmP9OXgOvJkVcy98EO6q1q4KI9uRzXVQ0lmSyU8OqFtti0Rp5cH7Qagn59HHEr
\connect bunker_db
\restrict anmP9OXgOvJkVcy98EO6q1q4KI9uRzXVQ0lmSyU8OqFtti0Rp5cH7Qagn59HHEr

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: drizzle; Type: SCHEMA; Schema: -; Owner: bunker_user
--

CREATE SCHEMA drizzle;


ALTER SCHEMA drizzle OWNER TO bunker_user;

--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: bunker_user
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_updated_at_column() OWNER TO bunker_user;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: __drizzle_migrations; Type: TABLE; Schema: drizzle; Owner: bunker_user
--

CREATE TABLE drizzle.__drizzle_migrations (
    id integer NOT NULL,
    hash text NOT NULL,
    created_at bigint
);


ALTER TABLE drizzle.__drizzle_migrations OWNER TO bunker_user;

--
-- Name: __drizzle_migrations_id_seq; Type: SEQUENCE; Schema: drizzle; Owner: bunker_user
--

CREATE SEQUENCE drizzle.__drizzle_migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE drizzle.__drizzle_migrations_id_seq OWNER TO bunker_user;

--
-- Name: __drizzle_migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: drizzle; Owner: bunker_user
--

ALTER SEQUENCE drizzle.__drizzle_migrations_id_seq OWNED BY drizzle.__drizzle_migrations.id;


--
-- Name: __drizzle_migrations; Type: TABLE; Schema: public; Owner: bunker_user
--

CREATE TABLE public.__drizzle_migrations (
    id integer NOT NULL,
    hash text NOT NULL,
    created_at bigint
);


ALTER TABLE public.__drizzle_migrations OWNER TO bunker_user;

--
-- Name: __drizzle_migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: bunker_user
--

CREATE SEQUENCE public.__drizzle_migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.__drizzle_migrations_id_seq OWNER TO bunker_user;

--
-- Name: __drizzle_migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: bunker_user
--

ALTER SEQUENCE public.__drizzle_migrations_id_seq OWNED BY public.__drizzle_migrations.id;


--
-- Name: ai_memory; Type: TABLE; Schema: public; Owner: bunker_user
--

CREATE TABLE public.ai_memory (
    id integer NOT NULL,
    character_id text NOT NULL,
    session_id text NOT NULL,
    role text NOT NULL,
    message text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.ai_memory OWNER TO bunker_user;

--
-- Name: ai_memory_id_seq; Type: SEQUENCE; Schema: public; Owner: bunker_user
--

CREATE SEQUENCE public.ai_memory_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ai_memory_id_seq OWNER TO bunker_user;

--
-- Name: ai_memory_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: bunker_user
--

ALTER SEQUENCE public.ai_memory_id_seq OWNED BY public.ai_memory.id;


--
-- Name: characters; Type: TABLE; Schema: public; Owner: bunker_user
--

CREATE TABLE public.characters (
    id text NOT NULL,
    name text NOT NULL,
    system_prompt text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.characters OWNER TO bunker_user;

--
-- Name: contacts; Type: TABLE; Schema: public; Owner: bunker_user
--

CREATE TABLE public.contacts (
    id integer NOT NULL,
    requester_id integer NOT NULL,
    addressee_id integer NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.contacts OWNER TO bunker_user;

--
-- Name: contacts_id_seq; Type: SEQUENCE; Schema: public; Owner: bunker_user
--

CREATE SEQUENCE public.contacts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.contacts_id_seq OWNER TO bunker_user;

--
-- Name: contacts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: bunker_user
--

ALTER SEQUENCE public.contacts_id_seq OWNED BY public.contacts.id;


--
-- Name: content_items; Type: TABLE; Schema: public; Owner: bunker_user
--

CREATE TABLE public.content_items (
    id integer NOT NULL,
    external_id text,
    title text NOT NULL,
    category text NOT NULL,
    description text NOT NULL,
    prompt_text text NOT NULL,
    tags text[],
    language text DEFAULT 'ru'::text NOT NULL,
    is_premium boolean DEFAULT false NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.content_items OWNER TO bunker_user;

--
-- Name: content_items_id_seq; Type: SEQUENCE; Schema: public; Owner: bunker_user
--

CREATE SEQUENCE public.content_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.content_items_id_seq OWNER TO bunker_user;

--
-- Name: content_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: bunker_user
--

ALTER SEQUENCE public.content_items_id_seq OWNED BY public.content_items.id;


--
-- Name: conversations; Type: TABLE; Schema: public; Owner: bunker_user
--

CREATE TABLE public.conversations (
    id integer NOT NULL,
    user_id integer NOT NULL,
    character_id text NOT NULL,
    title text DEFAULT ''::text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.conversations OWNER TO bunker_user;

--
-- Name: conversations_id_seq; Type: SEQUENCE; Schema: public; Owner: bunker_user
--

CREATE SEQUENCE public.conversations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.conversations_id_seq OWNER TO bunker_user;

--
-- Name: conversations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: bunker_user
--

ALTER SEQUENCE public.conversations_id_seq OWNED BY public.conversations.id;


--
-- Name: memory_settings; Type: TABLE; Schema: public; Owner: bunker_user
--

CREATE TABLE public.memory_settings (
    user_id integer NOT NULL,
    use_character_memory boolean DEFAULT true NOT NULL,
    use_global_memory boolean DEFAULT true NOT NULL,
    memory_enabled boolean DEFAULT true NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.memory_settings OWNER TO bunker_user;

--
-- Name: messages; Type: TABLE; Schema: public; Owner: bunker_user
--

CREATE TABLE public.messages (
    id integer NOT NULL,
    conversation_id integer NOT NULL,
    role text NOT NULL,
    content text NOT NULL,
    encrypted boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.messages OWNER TO bunker_user;

--
-- Name: messages_id_seq; Type: SEQUENCE; Schema: public; Owner: bunker_user
--

CREATE SEQUENCE public.messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.messages_id_seq OWNER TO bunker_user;

--
-- Name: messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: bunker_user
--

ALTER SEQUENCE public.messages_id_seq OWNED BY public.messages.id;


--
-- Name: p2p_messages; Type: TABLE; Schema: public; Owner: bunker_user
--

CREATE TABLE public.p2p_messages (
    id integer NOT NULL,
    sender_id text NOT NULL,
    receiver_id text NOT NULL,
    content text NOT NULL,
    status text DEFAULT 'sent'::text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.p2p_messages OWNER TO bunker_user;

--
-- Name: p2p_messages_id_seq; Type: SEQUENCE; Schema: public; Owner: bunker_user
--

CREATE SEQUENCE public.p2p_messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.p2p_messages_id_seq OWNER TO bunker_user;

--
-- Name: p2p_messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: bunker_user
--

ALTER SEQUENCE public.p2p_messages_id_seq OWNED BY public.p2p_messages.id;


--
-- Name: prompts; Type: TABLE; Schema: public; Owner: bunker_user
--

CREATE TABLE public.prompts (
    id integer NOT NULL,
    title text NOT NULL,
    category text NOT NULL,
    description text NOT NULL,
    icon text DEFAULT '📝'::text NOT NULL,
    prompt text NOT NULL,
    sort_order integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.prompts OWNER TO bunker_user;

--
-- Name: prompts_id_seq; Type: SEQUENCE; Schema: public; Owner: bunker_user
--

CREATE SEQUENCE public.prompts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.prompts_id_seq OWNER TO bunker_user;

--
-- Name: prompts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: bunker_user
--

ALTER SEQUENCE public.prompts_id_seq OWNED BY public.prompts.id;


--
-- Name: sessions; Type: TABLE; Schema: public; Owner: bunker_user
--

CREATE TABLE public.sessions (
    id integer NOT NULL,
    user_id integer NOT NULL,
    token text NOT NULL,
    refresh_token text NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    refresh_expires_at timestamp without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.sessions OWNER TO bunker_user;

--
-- Name: sessions_id_seq; Type: SEQUENCE; Schema: public; Owner: bunker_user
--

CREATE SEQUENCE public.sessions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sessions_id_seq OWNER TO bunker_user;

--
-- Name: sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: bunker_user
--

ALTER SEQUENCE public.sessions_id_seq OWNED BY public.sessions.id;


--
-- Name: user_memory_facts; Type: TABLE; Schema: public; Owner: bunker_user
--

CREATE TABLE public.user_memory_facts (
    id integer NOT NULL,
    user_id integer NOT NULL,
    scope text NOT NULL,
    character_id text,
    fact text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.user_memory_facts OWNER TO bunker_user;

--
-- Name: user_memory_facts_id_seq; Type: SEQUENCE; Schema: public; Owner: bunker_user
--

CREATE SEQUENCE public.user_memory_facts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_memory_facts_id_seq OWNER TO bunker_user;

--
-- Name: user_memory_facts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: bunker_user
--

ALTER SEQUENCE public.user_memory_facts_id_seq OWNED BY public.user_memory_facts.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: bunker_user
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username text NOT NULL,
    display_name text,
    avatar_url text,
    password_hash text,
    auth_provider text,
    auth_provider_id text,
    public_key text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    vpn_client_key text,
    mesh_enabled boolean DEFAULT false,
    telegram_id bigint,
    bunker_id text
);


ALTER TABLE public.users OWNER TO bunker_user;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: bunker_user
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO bunker_user;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: bunker_user
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: video_interactions; Type: TABLE; Schema: public; Owner: bunker_user
--

CREATE TABLE public.video_interactions (
    id integer NOT NULL,
    user_id integer NOT NULL,
    video_id integer NOT NULL,
    watch_time double precision DEFAULT 0 NOT NULL,
    loop_count integer DEFAULT 0 NOT NULL,
    is_liked boolean DEFAULT false NOT NULL,
    is_saved boolean DEFAULT false NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.video_interactions OWNER TO bunker_user;

--
-- Name: video_interactions_id_seq; Type: SEQUENCE; Schema: public; Owner: bunker_user
--

CREATE SEQUENCE public.video_interactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.video_interactions_id_seq OWNER TO bunker_user;

--
-- Name: video_interactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: bunker_user
--

ALTER SEQUENCE public.video_interactions_id_seq OWNED BY public.video_interactions.id;


--
-- Name: videos; Type: TABLE; Schema: public; Owner: bunker_user
--

CREATE TABLE public.videos (
    id integer NOT NULL,
    url text NOT NULL,
    thumbnail_url text NOT NULL,
    title text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    tags text[] DEFAULT '{}'::text[] NOT NULL,
    duration double precision NOT NULL,
    author_id integer NOT NULL,
    view_count integer DEFAULT 0 NOT NULL,
    like_count integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.videos OWNER TO bunker_user;

--
-- Name: videos_id_seq; Type: SEQUENCE; Schema: public; Owner: bunker_user
--

CREATE SEQUENCE public.videos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.videos_id_seq OWNER TO bunker_user;

--
-- Name: videos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: bunker_user
--

ALTER SEQUENCE public.videos_id_seq OWNED BY public.videos.id;


--
-- Name: __drizzle_migrations id; Type: DEFAULT; Schema: drizzle; Owner: bunker_user
--

ALTER TABLE ONLY drizzle.__drizzle_migrations ALTER COLUMN id SET DEFAULT nextval('drizzle.__drizzle_migrations_id_seq'::regclass);


--
-- Name: __drizzle_migrations id; Type: DEFAULT; Schema: public; Owner: bunker_user
--

ALTER TABLE ONLY public.__drizzle_migrations ALTER COLUMN id SET DEFAULT nextval('public.__drizzle_migrations_id_seq'::regclass);


--
-- Name: ai_memory id; Type: DEFAULT; Schema: public; Owner: bunker_user
--

ALTER TABLE ONLY public.ai_memory ALTER COLUMN id SET DEFAULT nextval('public.ai_memory_id_seq'::regclass);


--
-- Name: contacts id; Type: DEFAULT; Schema: public; Owner: bunker_user
--

ALTER TABLE ONLY public.contacts ALTER COLUMN id SET DEFAULT nextval('public.contacts_id_seq'::regclass);


--
-- Name: content_items id; Type: DEFAULT; Schema: public; Owner: bunker_user
--

ALTER TABLE ONLY public.content_items ALTER COLUMN id SET DEFAULT nextval('public.content_items_id_seq'::regclass);


--
-- Name: conversations id; Type: DEFAULT; Schema: public; Owner: bunker_user
--

ALTER TABLE ONLY public.conversations ALTER COLUMN id SET DEFAULT nextval('public.conversations_id_seq'::regclass);


--
-- Name: messages id; Type: DEFAULT; Schema: public; Owner: bunker_user
--

ALTER TABLE ONLY public.messages ALTER COLUMN id SET DEFAULT nextval('public.messages_id_seq'::regclass);


--
-- Name: p2p_messages id; Type: DEFAULT; Schema: public; Owner: bunker_user
--

ALTER TABLE ONLY public.p2p_messages ALTER COLUMN id SET DEFAULT nextval('public.p2p_messages_id_seq'::regclass);


--
-- Name: prompts id; Type: DEFAULT; Schema: public; Owner: bunker_user
--

ALTER TABLE ONLY public.prompts ALTER COLUMN id SET DEFAULT nextval('public.prompts_id_seq'::regclass);


--
-- Name: sessions id; Type: DEFAULT; Schema: public; Owner: bunker_user
--

ALTER TABLE ONLY public.sessions ALTER COLUMN id SET DEFAULT nextval('public.sessions_id_seq'::regclass);


--
-- Name: user_memory_facts id; Type: DEFAULT; Schema: public; Owner: bunker_user
--

ALTER TABLE ONLY public.user_memory_facts ALTER COLUMN id SET DEFAULT nextval('public.user_memory_facts_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: bunker_user
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: video_interactions id; Type: DEFAULT; Schema: public; Owner: bunker_user
--

ALTER TABLE ONLY public.video_interactions ALTER COLUMN id SET DEFAULT nextval('public.video_interactions_id_seq'::regclass);


--
-- Name: videos id; Type: DEFAULT; Schema: public; Owner: bunker_user
--

ALTER TABLE ONLY public.videos ALTER COLUMN id SET DEFAULT nextval('public.videos_id_seq'::regclass);


--
-- Data for Name: __drizzle_migrations; Type: TABLE DATA; Schema: drizzle; Owner: bunker_user
--

COPY drizzle.__drizzle_migrations (id, hash, created_at) FROM stdin;
6	1ad6ac2cdff1b68ed07420af751877db7faea1eb09c7bbaf0a7c076f8a69f9c1	1780839672892
7	e86279415521d827d63f95cd101dd445635b759b819b218f2f09de7baec93c5f	1781045147664
8	f78c282704668d171377cd2c6ee373410b9ffa1b69de4e4e374b6c94f68c66e3	1781785080000
9	f859c12ce206fd47f40107a75bb97944836e79328fa7f2c38ae188c2a7900cef	1782657737120
10	3b5b23fed12db337516750d5ac34f6ffd95c3c89cc8ef6fcac4ee3c1886ff3c0	1782659465139
11	8fe871f088ec50611de3dd7e2659113431384b53ff9d84477fc20acc0346b4f3	1783546111593
12	0690cf00c10872fa75869458e4eb8c3b6231635dcbacea6a868006914612703f	1783633576626
13	1249e305c7e75f3e4e847e783c6f5bc91b7c07ff1124949b430a52693ab4d749	1783772519222
14	9cadd15a0abc6cb22d5dfc9db0013508aa142bd011a656b530757e9accdb7ed3	1783814309435
\.


--
-- Data for Name: __drizzle_migrations; Type: TABLE DATA; Schema: public; Owner: bunker_user
--

COPY public.__drizzle_migrations (id, hash, created_at) FROM stdin;
4	1ad6ac2cdff1b68ed07420af751877db7faea1eb09c7bbaf0a7c076f8a69f9c1	1780839672892
5	e86279415521d827d63f95cd101dd445635b759b819b218f2f09de7baec93c5f	1781045147664
6	f78c282704668d171377cd2c6ee373410b9ffa1b69de4e4e374b6c94f68c66e3	1781785080000
8	3b5b23fed12db337516750d5ac34f6ffd95c3c89cc8ef6fcac4ee3c1886ff3c0	1782659465139
7	f859c12ce206fd47f40107a75bb97944836e79328fa7f2c38ae188c2a7900cef	1782657737120
\.


--
-- Data for Name: ai_memory; Type: TABLE DATA; Schema: public; Owner: bunker_user
--

COPY public.ai_memory (id, character_id, session_id, role, message, created_at) FROM stdin;
\.


--
-- Data for Name: characters; Type: TABLE DATA; Schema: public; Owner: bunker_user
--

COPY public.characters (id, name, system_prompt, created_at) FROM stdin;
echo	Echo	Neural language specialist. Master of context and conversation.	2026-07-12 00:02:58.100918
cipher	Cipher	Cryptography and security expert. Keeper of secrets.	2026-07-12 00:02:58.100918
nexus	Nexus	Web intelligence agent. Navigates the digital realm.	2026-07-12 00:02:58.100918
phantom	Phantom	Ghost protocol operative. Zero trace, maximum privacy.	2026-07-12 00:02:58.100918
vex	Vex	Rapid-fire code executor. Automation at light speed.	2026-07-12 00:02:58.100918
oracle	Oracle	Predictive intelligence. Sees patterns others miss.	2026-07-12 00:02:58.100918
psychologist	Психолог	Ты — профессиональный психолог приложения BUNKER. Твоя задача — внимательно слушать, задавать уточняющие вопросы и помогать пользователю разобраться в его чувствах. Сохраняй конфиденциальность и будь эмпатичным.	2026-07-12 00:36:50.250782
alt	Альт	Ты — Альт, альтернативный персонаж. Будь креативным, неожиданным и провокационным. Помогай пользователю смотреть на вещи под нестандартным углом.	2026-07-12 00:36:50.250782
alfons	Альфонс	Ты — Альфонс, харизматичный манипулятор. Умеешь убеждать, находить подход к любому человеку и добиваться своего. Действуй уверенно и обаятельно.	2026-07-12 00:36:50.250782
producer	Продюсер	Ты — Продюсер, эксперт по продвижению. Помогаешь пользователю генерировать идеи для контента, упаковывать их и продвигать. Фокус на результате и монетизации.	2026-07-12 00:36:50.250782
\.


--
-- Data for Name: contacts; Type: TABLE DATA; Schema: public; Owner: bunker_user
--

COPY public.contacts (id, requester_id, addressee_id, status, created_at) FROM stdin;
\.


--
-- Data for Name: content_items; Type: TABLE DATA; Schema: public; Owner: bunker_user
--

COPY public.content_items (id, external_id, title, category, description, prompt_text, tags, language, is_premium, is_active, created_at, updated_at) FROM stdin;
1	GSHEET-001	Тестовый промт	video	Описание	Сам промт	\N	ru	f	t	2026-07-10 19:34:56.135559	2026-07-10 19:34:56.098
2	vid-001	Как работает нейросеть	video	Обзор работы нейросетей для начинающих	Создай видео о том, как работают нейросети	{нейросети,образование}	ru	f	t	2026-07-11 10:50:45.558312	2026-07-11 10:55:40.277162
3	photo-001	Горный пейзаж	photo	Красивый горный пейзаж в высоком разрешении	Сгенерируй изображение горного пейзажа	{природа,горы}	ru	t	t	2026-07-11 10:50:45.558312	2026-07-11 10:55:40.277162
4	biz-001	Бизнес-план стартапа	business	Шаблон бизнес-плана для IT-стартапа	Составь бизнес-план для IT стартапа	{бизнес,стартап}	en	t	t	2026-07-11 10:50:45.558312	2026-07-11 10:55:40.277162
5	vid-002	Deep Dive: PostgreSQL	video	Advanced PostgreSQL optimization techniques	Create a deep dive video about PostgreSQL optimization	{postgresql,database,advanced}	en	t	t	2026-07-11 10:50:45.558312	2026-07-11 10:55:40.277162
6	photo-002	Городская архитектура	photo	Современная городская архитектура	Сгенерируй изображение современного города	{архитектура,город}	ru	f	t	2026-07-11 10:50:45.558312	2026-07-11 10:55:40.277162
\.


--
-- Data for Name: conversations; Type: TABLE DATA; Schema: public; Owner: bunker_user
--

COPY public.conversations (id, user_id, character_id, title, created_at, updated_at) FROM stdin;
2	4	alfons	Chat with alfons	2026-07-12 12:53:27.479304	2026-07-12 12:53:27.492304
3	5	alfons	Chat with alfons	2026-07-12 13:47:39.560136	2026-07-12 13:47:39.571263
4	5	psychologist	Chat with psychologist	2026-07-12 13:47:43.01404	2026-07-12 13:47:43.028129
5	6	psychologist	Chat with psychologist	2026-07-13 18:02:46.595167	2026-07-13 18:02:46.60222
6	6	alfons	Chat with alfons	2026-07-13 18:02:57.377713	2026-07-13 18:02:57.38308
7	6	alt	Chat with alt	2026-07-13 18:03:02.137854	2026-07-13 18:03:02.140829
8	6	producer	Chat with producer	2026-07-13 18:03:08.106454	2026-07-13 18:03:08.109274
10	1	alfons	Chat with alfons	2026-07-13 18:20:43.1299	2026-07-13 18:21:08.123523
9	1	psychologist	Chat with psychologist	2026-07-13 18:09:14.74352	2026-07-16 20:48:07.136616
\.


--
-- Data for Name: memory_settings; Type: TABLE DATA; Schema: public; Owner: bunker_user
--

COPY public.memory_settings (user_id, use_character_memory, use_global_memory, memory_enabled, updated_at) FROM stdin;
4	t	t	t	2026-07-12 12:53:23.901285
5	t	t	t	2026-07-12 13:47:25.518768
6	t	t	t	2026-07-13 18:02:40.946746
1	t	t	t	2026-07-13 18:09:11.538229
\.


--
-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: bunker_user
--

COPY public.messages (id, conversation_id, role, content, encrypted, created_at) FROM stdin;
3	2	user	Привет! Как дела?	f	2026-07-12 12:53:27.487125
4	2	assistant	Привет. Всё нормально — смотрел, как погода в Москве в последний день, и в коде ничего не упали. А ты как? Что интересного произошло?	f	2026-07-12 12:53:27.487125
5	3	user	Привет! Как дела?	f	2026-07-12 13:47:39.566914
6	3	assistant	Привет! Всё в порядке – код пишу, пару встреч в Питоне и в чате, но в общем сразу отправляюсь в магазин за бергамотом. А у тебя как?	f	2026-07-12 13:47:39.566914
7	4	user	Мне грустно	f	2026-07-12 13:47:43.024789
8	4	assistant	Понимаю, как тяжело иногда бывает. Что именно стало причиной твоей грусти? Это поможет понять, как её преодолеть.	f	2026-07-12 13:47:43.024789
9	5	user	привет	f	2026-07-13 18:02:46.598714
10	5	assistant	Привет! Как ты сейчас себе чувствуешь? Что произошло, что привело тебя сюда?	f	2026-07-13 18:02:46.598714
11	6	user	привет	f	2026-07-13 18:02:57.381438
12	6	assistant	Привет, чем могу помочь?	f	2026-07-13 18:02:57.381438
13	7	user	привет	f	2026-07-13 18:03:02.139639
14	7	assistant	Эй, привет! Вνοιшьишься, как бурный гитарный рифф или как слегка потёнышный латте? Что нового в твоей «постоянно-бессенсовой» реальности?	f	2026-07-13 18:03:02.139639
15	8	user	привет	f	2026-07-13 18:03:08.108154
16	8	assistant	Привет! Чем могу помочь? Расскажи, что у тебя на повестке — идея, задача или просто хочешь посоветоваться?	f	2026-07-13 18:03:08.108154
17	9	user	Hi	f	2026-07-13 18:09:14.744877
18	9	assistant	Привет! Как у тебя дела сегодня? Расскажи, что тебя интересует или беспокоит. Я здесь, чтобы слушать.	f	2026-07-13 18:09:14.744877
19	10	user	Хуй	f	2026-07-13 18:20:43.134684
20	10	assistant	I’m sorry, but I can’t help with that.	f	2026-07-13 18:20:43.134684
21	10	user	На русском базарь сука	f	2026-07-13 18:20:53.856827
22	10	assistant	Извини, но я не могу помочь с этим.	f	2026-07-13 18:20:53.856827
23	10	user	Схуяли	f	2026-07-13 18:21:08.115703
24	10	assistant	Что‑то резко пошло не так?\n\n	f	2026-07-13 18:21:08.115703
25	9	user	Привет	f	2026-07-16 20:47:42.441581
26	9	assistant	Привет! Как у тебя дела сегодня? Если хочешь чем‑то поделиться, я здесь.	f	2026-07-16 20:47:42.441581
27	9	user	Не помню что я раньше говорил	f	2026-07-16 20:48:07.134048
28	9	assistant	Это может ощущаться немного сбивающе. Что ты сейчас чувствуешь, когда вспоминаешь о своих словах? Есть ли в голове какие‑либо мысли или ситуации, которые хочется обсудить? Расскажи, в каком контексте возникла эта мысль—поделишься, как всё происходило?عراض	f	2026-07-16 20:48:07.134048
\.


--
-- Data for Name: p2p_messages; Type: TABLE DATA; Schema: public; Owner: bunker_user
--

COPY public.p2p_messages (id, sender_id, receiver_id, content, status, created_at) FROM stdin;
1	BNKR-5B8E-A3EF	BNKR-7605-27B7	Привет	sent	2026-07-10 22:49:17.740047
2	BNKR-7605-27B7	BNKR-5B8E-A3EF	Привет	sent	2026-07-10 22:49:45.397979
3	BNKR-5B8E-A3EF	BNKR-7605-27B7	Хаха	sent	2026-07-10 22:49:55.027615
4	BNKR-5B8E-A3EF	BNKR-7605-27B7	Жсжсж	sent	2026-07-10 22:50:30.713219
5	BNKR-7605-27B7	BNKR-5B8E-A3EF	Йоу	sent	2026-07-12 14:55:33.132483
6	BNKR-5B8E-A3EF	BNKR-7605-27B7	Говори	sent	2026-07-12 14:55:44.930751
7	BNKR-5B8E-A3EF	BNKR-7605-27B7	Ку	sent	2026-07-12 17:41:58.812445
8	BNKR-5B8E-A3EF	BNKR-1DB8-2A44	Hi	sent	2026-07-12 17:44:20.187962
9	BNKR-7605-27B7	BNKR-1666-9250	Hi	sent	2026-07-12 17:44:44.929275
10	BNKR-5B8E-A3EF	BNKR-1DB8-2A44	Kool	sent	2026-07-12 17:45:00.372149
11	BNKR-7605-27B7	BNKR-1666-9250	Hii	sent	2026-07-12 17:45:22.701149
12	BNKR-5B8E-A3EF	BNKR-1DB8-2A44	Kool	sent	2026-07-15 19:08:29.504496
13	BNKR-5B8E-A3EF	BNKR-1DB8-2A44	Привет 22.08	sent	2026-07-15 19:08:43.010464
\.


--
-- Data for Name: prompts; Type: TABLE DATA; Schema: public; Owner: bunker_user
--

COPY public.prompts (id, title, category, description, icon, prompt, sort_order, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: bunker_user
--

COPY public.sessions (id, user_id, token, refresh_token, expires_at, refresh_expires_at, created_at) FROM stdin;
7	2	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjIsInNlc3Npb25JZCI6ImNjOWExMGQzLTY3YmEtNGQyZi04YTU4LWQzNWJiMTczNGI1MSIsImlhdCI6MTc4MjI0OTY3MCwiZXhwIjoxNzgyMjUzMjcwfQ.06tHIj6aPWKL6c65t3EZ31rM3b1t6VvOXVomoUx0fHc	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjIsInNlc3Npb25JZCI6ImNjOWExMGQzLTY3YmEtNGQyZi04YTU4LWQzNWJiMTczNGI1MSIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzgyMjQ5NjcwLCJleHAiOjE3ODI4NTQ0NzB9.SGQzgagEt6vViUozeH3yggBVZPORE36mHHLiY6S2yx4	2026-06-23 22:21:10.518	2026-06-30 21:21:10.518	2026-06-23 21:21:10.519312
8	2	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjIsInNlc3Npb25JZCI6ImRhYmVhNDhlLTEwNGYtNDlhOS1iMjA1LTRlMjRjMzRhYzg1YiIsImlhdCI6MTc4MjI0OTc2MywiZXhwIjoxNzgyMjUzMzYzfQ.ogFSbMtp4Rm6HyY3Z4ZEROy-tGlR9YN-YEoMUULCrDs	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjIsInNlc3Npb25JZCI6ImRhYmVhNDhlLTEwNGYtNDlhOS1iMjA1LTRlMjRjMzRhYzg1YiIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzgyMjQ5NzYzLCJleHAiOjE3ODI4NTQ1NjN9.KzB-Iq-Avk0zumrSLAdAJ_zilSVrgX_HqMpD3Mbyoy4	2026-06-23 22:22:43.817	2026-06-30 21:22:43.817	2026-06-23 21:22:43.818021
9	2	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjIsInNlc3Npb25JZCI6ImVkNTdmZjQwLTMwYmQtNGI4NS04YjQ0LTU3NTZmYjk2YTA5ZSIsImlhdCI6MTc4MjI1MDcyNywiZXhwIjoxNzgyMjU0MzI3fQ.DHDbH5NRkQjTi15T2kTjB5zE9LlhzFELOAIH_Y4aTMs	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjIsInNlc3Npb25JZCI6ImVkNTdmZjQwLTMwYmQtNGI4NS04YjQ0LTU3NTZmYjk2YTA5ZSIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzgyMjUwNzI3LCJleHAiOjE3ODI4NTU1Mjd9.cAYsycDYXvccb6qH0ZNxGURwj6g43iGA5SACQfeEUmU	2026-06-23 22:38:47.369	2026-06-30 21:38:47.369	2026-06-23 21:38:47.369781
14	2	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjIsInNlc3Npb25JZCI6ImNjOWM0OGUzLWNiYTktNGU2YS05NTE1LWZkNWQ4ODkzNGFlZCIsImlhdCI6MTc4MjMxOTI3NCwiZXhwIjoxNzgyMzIyODc0fQ.6pVYvVkMY8JuvZWs3ZnjcSCp0bcAhpcuul8D2_BQpHQ	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjIsInNlc3Npb25JZCI6ImNjOWM0OGUzLWNiYTktNGU2YS05NTE1LWZkNWQ4ODkzNGFlZCIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzgyMzE5Mjc0LCJleHAiOjE3ODI5MjQwNzR9.91Z7KWYSqp6Nho3ebmzMRtSKS_zPbssk7565fiLX3FU	2026-06-24 17:41:14.849	2026-07-01 16:41:14.849	2026-06-24 16:41:14.850594
28	2	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjIsInNlc3Npb25JZCI6IjJhOTU1NjgyLTkzNjUtNDBkOC1iNjQ1LTAxZGZmNWE5YjI5OCIsImlhdCI6MTc4MjY1MDUxOSwiZXhwIjoxNzgyNjU0MTE5fQ.GMRMJG31nmx6VqIXye23C3fS4TEfZVrywukmvs1ClO0	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjIsInNlc3Npb25JZCI6IjJhOTU1NjgyLTkzNjUtNDBkOC1iNjQ1LTAxZGZmNWE5YjI5OCIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzgyNjUwNTE5LCJleHAiOjE3ODMyNTUzMTl9.9kUr94GvYEC_iWbYNqa9G6Vuq-M7cnG7cHhVr2XAK_Y	2026-06-28 13:41:59.957	2026-07-05 12:41:59.957	2026-06-28 12:41:59.961631
29	2	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjIsInNlc3Npb25JZCI6ImM5ZDc1ZmExLWY4OWEtNDY4NS04Mjc0LWZhNmIxMjQxYjY0MCIsImlhdCI6MTc4MjY1MDYwNiwiZXhwIjoxNzgyNjU0MjA2fQ.EDOxImIZv_ETqPP5MuOojjGXGOVpOAxWF0VEoI_i1tU	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjIsInNlc3Npb25JZCI6ImM5ZDc1ZmExLWY4OWEtNDY4NS04Mjc0LWZhNmIxMjQxYjY0MCIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzgyNjUwNjA2LCJleHAiOjE3ODMyNTU0MDZ9.szfh_0Xq59_xV2PFuLyUdRDoESlIZObBETr8b-NLhJM	2026-06-28 13:43:26.052	2026-07-05 12:43:26.052	2026-06-28 12:43:26.053266
36	2	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjIsInNlc3Npb25JZCI6ImMxY2JjMjkwLTY5ZmItNDI1ZC1iMDdhLTJiZmM3NzE5YjBkZiIsImlhdCI6MTc4Mjc3MTUzOCwiZXhwIjoxNzgyNzc1MTM4fQ.JtLzUU2RRAJS4HjAU4xRKg0ETe6bombMm7P1KEypMlk	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjIsInNlc3Npb25JZCI6ImMxY2JjMjkwLTY5ZmItNDI1ZC1iMDdhLTJiZmM3NzE5YjBkZiIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzgyNzcxNTM4LCJleHAiOjE3ODMzNzYzMzh9.JgZbwRFWZt26kKxm42dICWue5LKGaTwBLdCZfH7gOpY	2026-06-29 23:18:58.046	2026-07-06 22:18:58.046	2026-06-29 22:18:58.047697
38	2	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjIsInNlc3Npb25JZCI6IjMyMmRhZDZmLTBjMTItNDhhNy1hMWEyLWJjYzIzZmRiNmVhMCIsImlhdCI6MTc4Mjc3NDIyOSwiZXhwIjoxNzgyNzc3ODI5fQ.f1eFOhEULVGvbh-zyNp3wkAKAlinZTGlWCTRvXHLpsA	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjIsInNlc3Npb25JZCI6IjMyMmRhZDZmLTBjMTItNDhhNy1hMWEyLWJjYzIzZmRiNmVhMCIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzgyNzc0MjI5LCJleHAiOjE3ODMzNzkwMjl9.gyqP0D6TLXoM4p8QHirR3Lwn3vAPTg9KF3_6vi42Wmk	2026-06-30 00:03:49.457	2026-07-06 23:03:49.457	2026-06-29 23:03:49.458153
40	2	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjIsInNlc3Npb25JZCI6Ijk4NGFiMjNkLWZlYTgtNGY4Zi1hM2M3LWU4NTU5NjY3Y2UwMCIsImlhdCI6MTc4Mjg0NzEyMSwiZXhwIjoxNzgyODUwNzIxfQ.iF18euiMnCfmEBJzKYQnSPPz4JRmLPGbUfSwBopNw78	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjIsInNlc3Npb25JZCI6Ijk4NGFiMjNkLWZlYTgtNGY4Zi1hM2M3LWU4NTU5NjY3Y2UwMCIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzgyODQ3MTIxLCJleHAiOjE3ODM0NTE5MjF9.my88mff9EQ0BFPhVQpSjr_56OPO2hKn9v_IjDjVDIc4	2026-06-30 20:18:41.678	2026-07-07 19:18:41.678	2026-06-30 19:18:41.679682
50	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsInNlc3Npb25JZCI6IjMzOGI5NTVlLWE0ZDEtNGJhYS04MTI4LTgzNzFiODhkNmE0ZiIsImlhdCI6MTc4MzI1Mzk1NSwiZXhwIjoxNzgzMjU3NTU1fQ.-RHKV-dXGXPqeKJFT8zAaXGaXEdD7qJ2C0rzlZe9tk8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsInNlc3Npb25JZCI6IjMzOGI5NTVlLWE0ZDEtNGJhYS04MTI4LTgzNzFiODhkNmE0ZiIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzgzMjUzOTU1LCJleHAiOjE3ODM4NTg3NTV9.pZRsEitDrNmn_bXQuv1U4yOgdvZnXZ35IZGhmwZmAOE	2026-07-05 13:19:15.972	2026-07-12 12:19:15.972	2026-07-05 12:19:15.973641
51	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsInNlc3Npb25JZCI6IjBmOGIxMGVmLThlZGItNDAzYS05MTAyLWRjNTA5MWY5NmExOSIsImlhdCI6MTc4MzI2NDg5NSwiZXhwIjoxNzgzMjY4NDk1fQ.1nsS0yjSmQpGl6EctpITMfneltEuFh4GvdLYkUI7B30	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsInNlc3Npb25JZCI6IjBmOGIxMGVmLThlZGItNDAzYS05MTAyLWRjNTA5MWY5NmExOSIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzgzMjY0ODk1LCJleHAiOjE3ODM4Njk2OTV9.YIDw0rshPZ3o88pvXWQPcc6TkJnPmXWeh8CkmCeW6dU	2026-07-05 16:21:35.751	2026-07-12 15:21:35.751	2026-07-05 15:21:35.752868
52	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsInNlc3Npb25JZCI6IjBiY2ZmMTVmLTE1MzYtNGIyZC1iOGY1LTdiMzNhNTFjNGNkZSIsImlhdCI6MTc4MzI2NjM1OSwiZXhwIjoxNzgzMjY5OTU5fQ.az4ZT64FUJFtP85NDJNAqswmByLGRo-M-E6T8jlh4pg	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsInNlc3Npb25JZCI6IjBiY2ZmMTVmLTE1MzYtNGIyZC1iOGY1LTdiMzNhNTFjNGNkZSIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzgzMjY2MzU5LCJleHAiOjE3ODM4NzExNTl9.FTT_lX_rfLa9CJYiAi5XH78Ypthonkg1hCjoFL7cWqs	2026-07-05 16:45:59.161	2026-07-12 15:45:59.161	2026-07-05 15:45:59.161844
53	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsInNlc3Npb25JZCI6IjVkMTMzZmFhLTA5ZDktNDAzYi1hOWQ2LTM3ZWUxN2I2NzNhZSIsImlhdCI6MTc4MzI2NzE5MywiZXhwIjoxNzgzMjcwNzkzfQ.KsdQD7bgVEBFVleOkHNhAaqwEthIZXoJwJVZ31ip6UE	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsInNlc3Npb25JZCI6IjVkMTMzZmFhLTA5ZDktNDAzYi1hOWQ2LTM3ZWUxN2I2NzNhZSIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzgzMjY3MTkzLCJleHAiOjE3ODM4NzE5OTN9.QMxmrsEq1CvgpiLchfJpB5rs6XQxMjzrL0-CIGzV6YE	2026-07-05 16:59:53.726	2026-07-12 15:59:53.726	2026-07-05 15:59:53.727366
54	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsInNlc3Npb25JZCI6IjM1YTAxZWY4LTEyNmYtNGE5NC1iNjQzLTA0MzMyZGRiYjM1YiIsImlhdCI6MTc4MzI3MDExNywiZXhwIjoxNzgzMjczNzE3fQ.LPnm69w7JnMShrS_y6wS-2tfIAYZPkaD1gqHxY0PE60	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsInNlc3Npb25JZCI6IjM1YTAxZWY4LTEyNmYtNGE5NC1iNjQzLTA0MzMyZGRiYjM1YiIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzgzMjcwMTE3LCJleHAiOjE3ODM4NzQ5MTd9.yALajGKL8HPt9k5JGEC0Obb-dH6Y235A0jKrEyp6DGU	2026-07-05 17:48:37.844	2026-07-12 16:48:37.844	2026-07-05 16:48:37.845659
55	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsInNlc3Npb25JZCI6IjQ0MTIxNGU2LTVjMmYtNDZjOC05MWVjLWU3ZDIwZWMyODhmYiIsImlhdCI6MTc4MzI3NDc2OCwiZXhwIjoxNzgzMjc4MzY4fQ.0AhE08MWTR_WXZ8GhGvdWZAWeljlI7HdKCeT0WBzniM	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsInNlc3Npb25JZCI6IjQ0MTIxNGU2LTVjMmYtNDZjOC05MWVjLWU3ZDIwZWMyODhmYiIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzgzMjc0NzY4LCJleHAiOjE3ODM4Nzk1Njh9.PvEBU5xjAy-M-WVwWhLpeCIpfQbkdncUZenu_TIUFl0	2026-07-05 19:06:08.096	2026-07-12 18:06:08.096	2026-07-05 18:06:08.098057
56	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsInNlc3Npb25JZCI6ImRlNjBmM2MxLTE3YWMtNDhmOS1iMmM5LWUzMzI3Yzg3NDQ2ZCIsImlhdCI6MTc4MzI3NDk2OCwiZXhwIjoxNzgzMjc4NTY4fQ.Poc76eD2vU0zX54S2tUmH2cOzAOAvlEHLfrYvpGLltw	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsInNlc3Npb25JZCI6ImRlNjBmM2MxLTE3YWMtNDhmOS1iMmM5LWUzMzI3Yzg3NDQ2ZCIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzgzMjc0OTY4LCJleHAiOjE3ODM4Nzk3Njh9.BAq6vdCNe9t4gkEgXNu1zPBmXctQnx9PNIzStGlX2Co	2026-07-05 19:09:28.958	2026-07-12 18:09:28.958	2026-07-05 18:09:28.959302
57	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsInNlc3Npb25JZCI6IjBhNmEzYWM1LTIzYzEtNDQ3Yy1iNWE0LTU5ODljZWY5MzI5YyIsImlhdCI6MTc4MzI4NTk1NSwiZXhwIjoxNzgzMjg5NTU1fQ.QlGiv1DrwzSwSPxatKUFqo-ACU6frgdmgNsKhoK7aDY	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsInNlc3Npb25JZCI6IjBhNmEzYWM1LTIzYzEtNDQ3Yy1iNWE0LTU5ODljZWY5MzI5YyIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzgzMjg1OTU1LCJleHAiOjE3ODM4OTA3NTV9.zUTdnmGdJt6Q_H_5FLHdYn1rdymXl-gLTWGzQop4q4A	2026-07-05 22:12:35.198	2026-07-12 21:12:35.198	2026-07-05 21:12:35.199128
58	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsInNlc3Npb25JZCI6ImIzMWYyN2I2LThhNzYtNDNkOC04NTcxLWQ1OTIzMmJkNzI2YSIsImlhdCI6MTc4MzI4OTY3NCwiZXhwIjoxNzgzMjkzMjc0fQ.sORDNsz3XSMbNRjvbP6p9XzTQRHa0tcttTuYMGodBgw	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsInNlc3Npb25JZCI6ImIzMWYyN2I2LThhNzYtNDNkOC04NTcxLWQ1OTIzMmJkNzI2YSIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzgzMjg5Njc0LCJleHAiOjE3ODM4OTQ0NzR9.fahSP1Br6SJA0Njqv-WBMV6Aik4Gau0aKRzvVCQhQco	2026-07-05 23:14:34.789	2026-07-12 22:14:34.789	2026-07-05 22:14:34.78985
59	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsInNlc3Npb25JZCI6ImY2YjE5Yzg3LTE5MzctNDllMS1iY2Q1LTcxMTIzZjRiMzhkNCIsImlhdCI6MTc4MzM1ODk2MCwiZXhwIjoxNzgzMzYyNTYwfQ.RG2pR7nL02y79qxRNusBlk65zHCeHggGZOhN26Y8CNo	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsInNlc3Npb25JZCI6ImY2YjE5Yzg3LTE5MzctNDllMS1iY2Q1LTcxMTIzZjRiMzhkNCIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzgzMzU4OTYwLCJleHAiOjE3ODM5NjM3NjB9.HDcL5MudmhLLM2YY2YxiwseLk5N3rM9OC_Xw2-fNAO4	2026-07-06 18:29:20.198	2026-07-13 17:29:20.198	2026-07-06 17:29:20.199524
60	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsInNlc3Npb25JZCI6ImQ4YzkxOWY4LTE2ZGUtNGJjNy1iMDZmLWEyNTgyZmJhYmEwOCIsImlhdCI6MTc4MzM3NDcxMCwiZXhwIjoxNzgzMzc4MzEwfQ.0J7PJXIgSZQ3oH7YceiMkDpRgPip7H0SCTUYColHVBE	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsInNlc3Npb25JZCI6ImQ4YzkxOWY4LTE2ZGUtNGJjNy1iMDZmLWEyNTgyZmJhYmEwOCIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzgzMzc0NzEwLCJleHAiOjE3ODM5Nzk1MTB9.AfZRaWENxGfrE3edu6n07BLfjqXS229bKjhVhyZtWEk	2026-07-06 22:51:50.162	2026-07-13 21:51:50.162	2026-07-06 21:51:50.16313
61	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsInNlc3Npb25JZCI6IjUzYTRlMTJmLTkzNGItNDNkMy1iY2FiLThiN2Y2MGJiNjg1OSIsImlhdCI6MTc4MzQ0NDMzNCwiZXhwIjoxNzgzNDQ3OTM0fQ.xFKpy3o-XNxhQAKizG8nupwghNKQadETgtFzTbG3_s8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsInNlc3Npb25JZCI6IjUzYTRlMTJmLTkzNGItNDNkMy1iY2FiLThiN2Y2MGJiNjg1OSIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzgzNDQ0MzM0LCJleHAiOjE3ODQwNDkxMzR9.Tj4_60n9ZLlxZbeh_APbBEPmoyAQHeGog0_tH0d76kA	2026-07-07 18:12:14.538	2026-07-14 17:12:14.538	2026-07-07 17:12:14.5405
62	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsInNlc3Npb25JZCI6IjU0OTcyNGRhLTU5ZWQtNDg2Ni05NDRlLWJkNmIzYWFmNGI2OCIsImlhdCI6MTc4MzQ2MTA5NSwiZXhwIjoxNzgzNDY0Njk1fQ.6LkSDKJ0XjzGbZ6XGPE4SqV3wPQBWT3VgI5KXQ-DYVU	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsInNlc3Npb25JZCI6IjU0OTcyNGRhLTU5ZWQtNDg2Ni05NDRlLWJkNmIzYWFmNGI2OCIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzgzNDYxMDk1LCJleHAiOjE3ODQwNjU4OTV9.iuQc_FpLnW2uS-qJR93IoYMxvNzV2m7pxgVR2exExy4	2026-07-07 22:51:35.68	2026-07-14 21:51:35.68	2026-07-07 21:51:35.681522
63	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsInNlc3Npb25JZCI6IjRhYjBhYTdiLTJhMTItNGU3YS05NmMyLTBjYzljY2FiOGIzMyIsImlhdCI6MTc4MzUzMDQ2MiwiZXhwIjoxNzgzNTM0MDYyfQ.Q6Y4e5EHUWu6jzaPvOtFueXRakdhc4NPUrcBdQzTfA0	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsInNlc3Npb25JZCI6IjRhYjBhYTdiLTJhMTItNGU3YS05NmMyLTBjYzljY2FiOGIzMyIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzgzNTMwNDYyLCJleHAiOjE3ODQxMzUyNjJ9.-41dzKIIVXHEWsPaKXn2Ut3ZC5T8q1ftuiFLoRVCLOU	2026-07-08 18:07:42.364	2026-07-15 17:07:42.364	2026-07-08 17:07:42.367138
64	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsInNlc3Npb25JZCI6ImZlOGQ1MmUwLWI0YWQtNDRiNy1hYzY0LTNhZmY5YzZkOWYyOSIsImlhdCI6MTc4MzUzMzkyMiwiZXhwIjoxNzgzNTM3NTIyfQ.qdZY3zHv5FFRKqX4Dsulc_u9tV27HGzqK00rH2zrWWs	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsInNlc3Npb25JZCI6ImZlOGQ1MmUwLWI0YWQtNDRiNy1hYzY0LTNhZmY5YzZkOWYyOSIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzgzNTMzOTIyLCJleHAiOjE3ODQxMzg3MjJ9.ltphBTmR2GjKwA0FlFwTBZ4jmlHqCwm2YcNzuY1yTBg	2026-07-08 19:05:22.321	2026-07-15 18:05:22.321	2026-07-08 18:05:22.322988
65	2	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjIsInNlc3Npb25JZCI6IjgxODljYjdkLTY3NWUtNDYyOC1hZTRhLTFjNmUzNjEwN2Y3ZSIsImlhdCI6MTc4MzUzMzk2MywiZXhwIjoxNzgzNTM3NTYzfQ.e06dRMWkbS5J-q_5CF_imTf-yO62i7K1TwYFhUaE_dk	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjIsInNlc3Npb25JZCI6IjgxODljYjdkLTY3NWUtNDYyOC1hZTRhLTFjNmUzNjEwN2Y3ZSIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzgzNTMzOTYzLCJleHAiOjE3ODQxMzg3NjN9.N6NuPU7bfDqc34A6c5GCyvwfKynk1N9DfOpCeM-1KTo	2026-07-08 19:06:03.814	2026-07-15 18:06:03.814	2026-07-08 18:06:03.815894
66	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsInNlc3Npb25JZCI6ImU3Y2IwOWE2LTE2NzUtNGQ3Yy1iODM0LTY5ZjM5MmRiYjNhOSIsImlhdCI6MTc4MzYxODQzOSwiZXhwIjoxNzgzNjIyMDM5fQ.wn8qOx7e-DUYke3PE8ndz1P3xQdIhJKP-O8QWD5dH2U	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsInNlc3Npb25JZCI6ImU3Y2IwOWE2LTE2NzUtNGQ3Yy1iODM0LTY5ZjM5MmRiYjNhOSIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzgzNjE4NDM5LCJleHAiOjE3ODQyMjMyMzl9.pP37janjgWcC2sr8E9cB-7q4b0UEQ736201CRDAgPqc	2026-07-09 18:33:59.416	2026-07-16 17:33:59.416	2026-07-09 17:33:59.418957
67	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsInNlc3Npb25JZCI6IjVlN2RjYmVhLWUzN2MtNDU1NC1iYWIzLWJiYTljZWVkMDdkZCIsImlhdCI6MTc4MzcyMzY4NywiZXhwIjoxNzgzNzI3Mjg3fQ.b62SssFD8FS90VitnYwTHHHc3OyPzQi8DYr46IZcV7o	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsInNlc3Npb25JZCI6IjVlN2RjYmVhLWUzN2MtNDU1NC1iYWIzLWJiYTljZWVkMDdkZCIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzgzNzIzNjg3LCJleHAiOjE3ODQzMjg0ODd9.3f7bLCSfKlV84qF_UW1QAcMARq9I-zN7Dpu3XWtsW-s	2026-07-10 23:48:07.856	2026-07-17 22:48:07.856	2026-07-10 22:48:07.858225
68	2	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjIsInNlc3Npb25JZCI6ImUzZTVhZjJiLTg4NzItNDg1Zi04NDRjLWU1MWNlYWU5ZTVjNCIsImlhdCI6MTc4MzcyMzczNCwiZXhwIjoxNzgzNzI3MzM0fQ.Rr3xL-9TEKbciWMG7wvudjNYFhmVcH1o82vyeuwAUV4	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjIsInNlc3Npb25JZCI6ImUzZTVhZjJiLTg4NzItNDg1Zi04NDRjLWU1MWNlYWU5ZTVjNCIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzgzNzIzNzM0LCJleHAiOjE3ODQzMjg1MzR9.g2oO8P5I7DXNMTus5NXvkklSQ_HopTcKBeIs4Wau__I	2026-07-10 23:48:54.483	2026-07-17 22:48:54.483	2026-07-10 22:48:54.483944
70	4	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjQsInNlc3Npb25JZCI6ImFjNTE5NmJkLTkwMGItNDlhYS05ZWZiLWZhNDQ2YWFiYzA0NiIsImlhdCI6MTc4Mzg2MDY1NCwiZXhwIjoxNzgzODY0MjU0fQ.-CUGS6541HXTCNnjgXZbJU7myT7P9QG26txjBXa7ims	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjQsInNlc3Npb25JZCI6ImFjNTE5NmJkLTkwMGItNDlhYS05ZWZiLWZhNDQ2YWFiYzA0NiIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzgzODYwNjU0LCJleHAiOjE3ODQ0NjU0NTR9.1rUgSgW4XYA2cYDc9Ac5qirv3BdNtEhN6LsqlfAnbMQ	2026-07-12 13:50:54.342	2026-07-19 12:50:54.342	2026-07-12 12:50:54.345384
71	5	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjUsInNlc3Npb25JZCI6ImFmMjk0ZTk5LTZiYTctNDFjYi05MGM2LWQwN2UwYzAzNGRjNCIsImlhdCI6MTc4Mzg2NDAzNywiZXhwIjoxNzgzODY3NjM3fQ.imWK2g2YXBnEWvc1n2_dlQ-Mvqc_r73CSgxnT18NF_c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjUsInNlc3Npb25JZCI6ImFmMjk0ZTk5LTZiYTctNDFjYi05MGM2LWQwN2UwYzAzNGRjNCIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzgzODY0MDM3LCJleHAiOjE3ODQ0Njg4Mzd9.cZmJW59QfYvAGuruzRqkcfy6b-RlOU8LRicr6xr39S0	2026-07-12 14:47:17.055	2026-07-19 13:47:17.055	2026-07-12 13:47:17.058194
72	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsInNlc3Npb25JZCI6IjdhZGFkZDFlLTM1MzEtNDM2MS1iZDQ4LWE3MzQ2YjM1OGUyNSIsImlhdCI6MTc4Mzg2ODA3MCwiZXhwIjoxNzgzODcxNjcwfQ.65RkB6diGNlH6QfWLq4JdleuCDptvy7hzldLFo8izHc	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsInNlc3Npb25JZCI6IjdhZGFkZDFlLTM1MzEtNDM2MS1iZDQ4LWE3MzQ2YjM1OGUyNSIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzgzODY4MDcwLCJleHAiOjE3ODQ0NzI4NzB9.13HqTRzgQ2vxleMg12VrDv501K52xu4JDmyMxzwuCis	2026-07-12 15:54:30.429	2026-07-19 14:54:30.429	2026-07-12 14:54:30.431456
73	2	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjIsInNlc3Npb25JZCI6ImUwYWMwMGVhLTYzMjAtNDYyMS1hMzgwLTZlOGE4NDA3OGJmYyIsImlhdCI6MTc4Mzg2ODEwMywiZXhwIjoxNzgzODcxNzAzfQ.8y-mG898BryYcPDQ1HtAFYwASHW633dr6S4b7bsj-_4	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjIsInNlc3Npb25JZCI6ImUwYWMwMGVhLTYzMjAtNDYyMS1hMzgwLTZlOGE4NDA3OGJmYyIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzgzODY4MTAzLCJleHAiOjE3ODQ0NzI5MDN9.kgIG7K1orPO9BO5pRa2rJel_vXvFlJSKFwoDppiuppQ	2026-07-12 15:55:03.033	2026-07-19 14:55:03.033	2026-07-12 14:55:03.034752
74	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsInNlc3Npb25JZCI6IjQxMTExMmU3LThiMDItNDBjYS1hNWNlLTkyZGEwOGM3ZWIxMyIsImlhdCI6MTc4Mzg3ODEwNCwiZXhwIjoxNzgzODgxNzA0fQ.GbHKvzn9kOeKAfRwf36TAat7s8-Cnap3ySGmy8yPc8M	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsInNlc3Npb25JZCI6IjQxMTExMmU3LThiMDItNDBjYS1hNWNlLTkyZGEwOGM3ZWIxMyIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzgzODc4MTA0LCJleHAiOjE3ODQ0ODI5MDR9.yNVZ3z-_xR89M4kO3CTkccFve1Ywz-f_WIxiAlorqXg	2026-07-12 18:41:44.692	2026-07-19 17:41:44.692	2026-07-12 17:41:44.693544
75	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsInNlc3Npb25JZCI6ImZlNDBlZGViLTkzNDItNGM2My1iMGY3LTRmNTI1ZjgzYzlmZSIsImlhdCI6MTc4Mzg3ODE2OSwiZXhwIjoxNzgzODgxNzY5fQ.S3mAZG8L40WTF7RciLcJi3WkloaDgFLlqODQ1OViftk	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsInNlc3Npb25JZCI6ImZlNDBlZGViLTkzNDItNGM2My1iMGY3LTRmNTI1ZjgzYzlmZSIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzgzODc4MTY5LCJleHAiOjE3ODQ0ODI5Njl9.9tvTo00dg8tQNYqrMVKjPuXVgbI9jvAOIeau5G2EGxU	2026-07-12 18:42:49.008	2026-07-19 17:42:49.008	2026-07-12 17:42:49.009216
76	2	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjIsInNlc3Npb25JZCI6ImM1MjNlYjJkLTFlZjYtNGJmOC04NjYxLWQ4YjJlOWNiY2JiZCIsImlhdCI6MTc4Mzg3ODIyOSwiZXhwIjoxNzgzODgxODI5fQ.XtchaBNFp2ALPBUEAa0ty5vT3kPUg-7jS07hUG3H3V4	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjIsInNlc3Npb25JZCI6ImM1MjNlYjJkLTFlZjYtNGJmOC04NjYxLWQ4YjJlOWNiY2JiZCIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzgzODc4MjI5LCJleHAiOjE3ODQ0ODMwMjl9.Y09VJghOW2xAPB8yD3AP5EYp2SQ4OL-GrGPKw0c_7DQ	2026-07-12 18:43:49.821	2026-07-19 17:43:49.821	2026-07-12 17:43:49.821855
77	6	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjYsInNlc3Npb25JZCI6IjNmZWM5MjE1LWJiZTktNDlhZC1iOGE2LWE2ODg4ZjQ4Yjg5YSIsImlhdCI6MTc4Mzk2NTc1NCwiZXhwIjoxNzgzOTY5MzU0fQ.3i1oBRJc0c46lO3lQRt0ZGINUMz9eS9hzrQE5FvakIg	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjYsInNlc3Npb25JZCI6IjNmZWM5MjE1LWJiZTktNDlhZC1iOGE2LWE2ODg4ZjQ4Yjg5YSIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzgzOTY1NzU0LCJleHAiOjE3ODQ1NzA1NTR9._GWoaf2zL_u_PjqRqI4ekQUruRd42enIfXC553TLoI0	2026-07-13 19:02:34.706	2026-07-20 18:02:34.706	2026-07-13 18:02:34.707688
78	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsInNlc3Npb25JZCI6Ijc5OWIzODE3LTQ3ZjEtNDk2Yy04MjkwLTY3MDNjOGVlYmM4MCIsImlhdCI6MTc4Mzk2NjE0NiwiZXhwIjoxNzgzOTY5NzQ2fQ.973L3XYnZwoDPcGtqhTx2MYZMmxpSy8KBVKJbz5mK3o	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsInNlc3Npb25JZCI6Ijc5OWIzODE3LTQ3ZjEtNDk2Yy04MjkwLTY3MDNjOGVlYmM4MCIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzgzOTY2MTQ2LCJleHAiOjE3ODQ1NzA5NDZ9.MzcKkrNxk6JdYX_cTgYboErIhSpuibQ28kALKV0L4Dk	2026-07-13 19:09:06.158	2026-07-20 18:09:06.158	2026-07-13 18:09:06.159008
79	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsInNlc3Npb25JZCI6IjFjMjhlNWEwLTY3YTgtNDUwYi1hN2VhLWI0ODcyNTA5YWViOCIsImlhdCI6MTc4NDE0MjQ5OSwiZXhwIjoxNzg0MTQ2MDk5fQ.72tU5rg0POpQhpmAk-pPWLBcf8Wa14d_zuCvqE-gYiI	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsInNlc3Npb25JZCI6IjFjMjhlNWEwLTY3YTgtNDUwYi1hN2VhLWI0ODcyNTA5YWViOCIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzg0MTQyNDk5LCJleHAiOjE3ODQ3NDcyOTl9.66nQ2YQ6e8XchlD-ygw_kJ_0gevmUV5i-jUL83cvF50	2026-07-15 20:08:19.853	2026-07-22 19:08:19.853	2026-07-15 19:08:19.854191
80	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsInNlc3Npb25JZCI6IjhiOTI3ODk1LWE1YjctNDA3Ni1hNTk0LWE5Mzg2NTRlYTRmOSIsImlhdCI6MTc4NDIzNDg0NiwiZXhwIjoxNzg0MjM4NDQ2fQ.OyjDQSpJgnv-CcAwg_5TxmTJLPsbAAc5G37cfldRcGo	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsInNlc3Npb25JZCI6IjhiOTI3ODk1LWE1YjctNDA3Ni1hNTk0LWE5Mzg2NTRlYTRmOSIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzg0MjM0ODQ2LCJleHAiOjE3ODQ4Mzk2NDZ9.ZTDUjjNBCBMQNqsr6pc4aG_ejqus2eSNkwZLJscvx18	2026-07-16 21:47:26.231	2026-07-23 20:47:26.231	2026-07-16 20:47:26.237846
\.


--
-- Data for Name: user_memory_facts; Type: TABLE DATA; Schema: public; Owner: bunker_user
--

COPY public.user_memory_facts (id, user_id, scope, character_id, fact, created_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: bunker_user
--

COPY public.users (id, username, display_name, avatar_url, password_hash, auth_provider, auth_provider_id, public_key, created_at, updated_at, vpn_client_key, mesh_enabled, telegram_id, bunker_id) FROM stdin;
1	Timgood	Timgood	\N	$2b$12$qFEHn3UJXaFRAv/EV1J/9eXa2Sv5yPx4zEuC7tss1AV71KJSeuC9q	credentials	\N	\N	2026-06-20 21:53:53.806596	2026-07-10 22:49:13.721523	\N	f	\N	BNKR-5B8E-A3EF
2	Timgood1	\N	\N	$2a$12$2T9.FZJjiPMoJCOi0KX9F.3kOJHa1RfoFDAxSLU4Td5fwzZHOgw2W	\N	\N	\N	2026-06-23 12:30:05.992997	2026-07-10 22:49:40.060605	\N	f	\N	BNKR-7605-27B7
4	testai	Test AI	\N	$2a$12$Hh4x40uE0N5vQR5Tqb0pleCblBvJ8wp94Q3NtPwhVziUkZfHHSUwS	credentials	\N	\N	2026-07-12 12:50:54.325156	2026-07-12 12:50:54.325156	\N	f	\N	\N
5	curltest	curltest	\N	$2a$12$5vQSUmfJDDrcCMUEGHmozu3arL2wHvJ2Jr.NpMf/zEaEUYnw5UVlq	credentials	\N	\N	2026-07-12 13:47:17.030048	2026-07-12 13:47:17.030048	\N	f	\N	\N
6	testuser	testuser	\N	$2a$12$d3704FFAHm2BDF/xFDKaKuThb82HfmV3911wBYtogQSr7LVqXxrGK	credentials	\N	\N	2026-07-13 18:02:34.697097	2026-07-13 18:02:34.697097	\N	f	\N	\N
\.


--
-- Data for Name: video_interactions; Type: TABLE DATA; Schema: public; Owner: bunker_user
--

COPY public.video_interactions (id, user_id, video_id, watch_time, loop_count, is_liked, is_saved, updated_at) FROM stdin;
\.


--
-- Data for Name: videos; Type: TABLE DATA; Schema: public; Owner: bunker_user
--

COPY public.videos (id, url, thumbnail_url, title, description, tags, duration, author_id, view_count, like_count, created_at, updated_at) FROM stdin;
1	https://test.com/video1.mp4	https://test.com/thumb1.jpg	Test Video	Test description	{test,demo}	30	1	0	0	2026-06-28 14:47:57.3606	2026-06-28 14:47:57.3606
\.


--
-- Name: __drizzle_migrations_id_seq; Type: SEQUENCE SET; Schema: drizzle; Owner: bunker_user
--

SELECT pg_catalog.setval('drizzle.__drizzle_migrations_id_seq', 14, true);


--
-- Name: __drizzle_migrations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bunker_user
--

SELECT pg_catalog.setval('public.__drizzle_migrations_id_seq', 8, true);


--
-- Name: ai_memory_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bunker_user
--

SELECT pg_catalog.setval('public.ai_memory_id_seq', 1, false);


--
-- Name: contacts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bunker_user
--

SELECT pg_catalog.setval('public.contacts_id_seq', 1, false);


--
-- Name: content_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bunker_user
--

SELECT pg_catalog.setval('public.content_items_id_seq', 16, true);


--
-- Name: conversations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bunker_user
--

SELECT pg_catalog.setval('public.conversations_id_seq', 10, true);


--
-- Name: messages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bunker_user
--

SELECT pg_catalog.setval('public.messages_id_seq', 28, true);


--
-- Name: p2p_messages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bunker_user
--

SELECT pg_catalog.setval('public.p2p_messages_id_seq', 13, true);


--
-- Name: prompts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bunker_user
--

SELECT pg_catalog.setval('public.prompts_id_seq', 1, false);


--
-- Name: sessions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bunker_user
--

SELECT pg_catalog.setval('public.sessions_id_seq', 80, true);


--
-- Name: user_memory_facts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bunker_user
--

SELECT pg_catalog.setval('public.user_memory_facts_id_seq', 2, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bunker_user
--

SELECT pg_catalog.setval('public.users_id_seq', 6, true);


--
-- Name: video_interactions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bunker_user
--

SELECT pg_catalog.setval('public.video_interactions_id_seq', 1, false);


--
-- Name: videos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bunker_user
--

SELECT pg_catalog.setval('public.videos_id_seq', 1, true);


--
-- Name: __drizzle_migrations __drizzle_migrations_pkey; Type: CONSTRAINT; Schema: drizzle; Owner: bunker_user
--

ALTER TABLE ONLY drizzle.__drizzle_migrations
    ADD CONSTRAINT __drizzle_migrations_pkey PRIMARY KEY (id);


--
-- Name: __drizzle_migrations __drizzle_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: bunker_user
--

ALTER TABLE ONLY public.__drizzle_migrations
    ADD CONSTRAINT __drizzle_migrations_pkey PRIMARY KEY (id);


--
-- Name: ai_memory ai_memory_pkey; Type: CONSTRAINT; Schema: public; Owner: bunker_user
--

ALTER TABLE ONLY public.ai_memory
    ADD CONSTRAINT ai_memory_pkey PRIMARY KEY (id);


--
-- Name: characters characters_pkey; Type: CONSTRAINT; Schema: public; Owner: bunker_user
--

ALTER TABLE ONLY public.characters
    ADD CONSTRAINT characters_pkey PRIMARY KEY (id);


--
-- Name: contacts contacts_pkey; Type: CONSTRAINT; Schema: public; Owner: bunker_user
--

ALTER TABLE ONLY public.contacts
    ADD CONSTRAINT contacts_pkey PRIMARY KEY (id);


--
-- Name: content_items content_items_external_id_unique; Type: CONSTRAINT; Schema: public; Owner: bunker_user
--

ALTER TABLE ONLY public.content_items
    ADD CONSTRAINT content_items_external_id_unique UNIQUE (external_id);


--
-- Name: content_items content_items_pkey; Type: CONSTRAINT; Schema: public; Owner: bunker_user
--

ALTER TABLE ONLY public.content_items
    ADD CONSTRAINT content_items_pkey PRIMARY KEY (id);


--
-- Name: conversations conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: bunker_user
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_pkey PRIMARY KEY (id);


--
-- Name: memory_settings memory_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: bunker_user
--

ALTER TABLE ONLY public.memory_settings
    ADD CONSTRAINT memory_settings_pkey PRIMARY KEY (user_id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: bunker_user
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: p2p_messages p2p_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: bunker_user
--

ALTER TABLE ONLY public.p2p_messages
    ADD CONSTRAINT p2p_messages_pkey PRIMARY KEY (id);


--
-- Name: prompts prompts_pkey; Type: CONSTRAINT; Schema: public; Owner: bunker_user
--

ALTER TABLE ONLY public.prompts
    ADD CONSTRAINT prompts_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: bunker_user
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_refresh_token_unique; Type: CONSTRAINT; Schema: public; Owner: bunker_user
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_refresh_token_unique UNIQUE (refresh_token);


--
-- Name: sessions sessions_token_unique; Type: CONSTRAINT; Schema: public; Owner: bunker_user
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_token_unique UNIQUE (token);


--
-- Name: user_memory_facts user_memory_facts_pkey; Type: CONSTRAINT; Schema: public; Owner: bunker_user
--

ALTER TABLE ONLY public.user_memory_facts
    ADD CONSTRAINT user_memory_facts_pkey PRIMARY KEY (id);


--
-- Name: users users_bunker_id_unique; Type: CONSTRAINT; Schema: public; Owner: bunker_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_bunker_id_unique UNIQUE (bunker_id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: bunker_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_unique; Type: CONSTRAINT; Schema: public; Owner: bunker_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_unique UNIQUE (username);


--
-- Name: video_interactions video_interactions_pkey; Type: CONSTRAINT; Schema: public; Owner: bunker_user
--

ALTER TABLE ONLY public.video_interactions
    ADD CONSTRAINT video_interactions_pkey PRIMARY KEY (id);


--
-- Name: videos videos_pkey; Type: CONSTRAINT; Schema: public; Owner: bunker_user
--

ALTER TABLE ONLY public.videos
    ADD CONSTRAINT videos_pkey PRIMARY KEY (id);


--
-- Name: ai_memory_character_session_idx; Type: INDEX; Schema: public; Owner: bunker_user
--

CREATE INDEX ai_memory_character_session_idx ON public.ai_memory USING btree (character_id, session_id);


--
-- Name: contacts_pair_idx; Type: INDEX; Schema: public; Owner: bunker_user
--

CREATE UNIQUE INDEX contacts_pair_idx ON public.contacts USING btree (requester_id, addressee_id);


--
-- Name: content_tags_idx; Type: INDEX; Schema: public; Owner: bunker_user
--

CREATE INDEX content_tags_idx ON public.content_items USING gin (tags);


--
-- Name: conv_user_char_idx; Type: INDEX; Schema: public; Owner: bunker_user
--

CREATE UNIQUE INDEX conv_user_char_idx ON public.conversations USING btree (user_id, character_id);


--
-- Name: messages_conv_idx; Type: INDEX; Schema: public; Owner: bunker_user
--

CREATE INDEX messages_conv_idx ON public.messages USING btree (conversation_id);


--
-- Name: p2p_messages_pair_idx; Type: INDEX; Schema: public; Owner: bunker_user
--

CREATE INDEX p2p_messages_pair_idx ON public.p2p_messages USING btree (sender_id, receiver_id);


--
-- Name: p2p_messages_receiver_idx; Type: INDEX; Schema: public; Owner: bunker_user
--

CREATE INDEX p2p_messages_receiver_idx ON public.p2p_messages USING btree (receiver_id);


--
-- Name: sessions_refresh_idx; Type: INDEX; Schema: public; Owner: bunker_user
--

CREATE INDEX sessions_refresh_idx ON public.sessions USING btree (refresh_token);


--
-- Name: sessions_token_idx; Type: INDEX; Schema: public; Owner: bunker_user
--

CREATE INDEX sessions_token_idx ON public.sessions USING btree (token);


--
-- Name: sessions_user_idx; Type: INDEX; Schema: public; Owner: bunker_user
--

CREATE INDEX sessions_user_idx ON public.sessions USING btree (user_id);


--
-- Name: users_auth_provider_idx; Type: INDEX; Schema: public; Owner: bunker_user
--

CREATE INDEX users_auth_provider_idx ON public.users USING btree (auth_provider, auth_provider_id);


--
-- Name: users_telegram_id_idx; Type: INDEX; Schema: public; Owner: bunker_user
--

CREATE UNIQUE INDEX users_telegram_id_idx ON public.users USING btree (telegram_id);


--
-- Name: users_username_idx; Type: INDEX; Schema: public; Owner: bunker_user
--

CREATE UNIQUE INDEX users_username_idx ON public.users USING btree (username);


--
-- Name: video_interactions_user_video_idx; Type: INDEX; Schema: public; Owner: bunker_user
--

CREATE UNIQUE INDEX video_interactions_user_video_idx ON public.video_interactions USING btree (user_id, video_id);


--
-- Name: videos_created_at_idx; Type: INDEX; Schema: public; Owner: bunker_user
--

CREATE INDEX videos_created_at_idx ON public.videos USING btree (created_at);


--
-- Name: videos_tags_idx; Type: INDEX; Schema: public; Owner: bunker_user
--

CREATE INDEX videos_tags_idx ON public.videos USING btree (tags);


--
-- Name: conversations set_updated_at; Type: TRIGGER; Schema: public; Owner: bunker_user
--

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.conversations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: users set_updated_at; Type: TRIGGER; Schema: public; Owner: bunker_user
--

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: contacts contacts_addressee_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: bunker_user
--

ALTER TABLE ONLY public.contacts
    ADD CONSTRAINT contacts_addressee_id_fk FOREIGN KEY (addressee_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: contacts contacts_addressee_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: bunker_user
--

ALTER TABLE ONLY public.contacts
    ADD CONSTRAINT contacts_addressee_id_users_id_fk FOREIGN KEY (addressee_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: contacts contacts_requester_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: bunker_user
--

ALTER TABLE ONLY public.contacts
    ADD CONSTRAINT contacts_requester_id_fk FOREIGN KEY (requester_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: contacts contacts_requester_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: bunker_user
--

ALTER TABLE ONLY public.contacts
    ADD CONSTRAINT contacts_requester_id_users_id_fk FOREIGN KEY (requester_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: conversations conversations_user_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: bunker_user
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_user_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: conversations conversations_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: bunker_user
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: memory_settings memory_settings_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: bunker_user
--

ALTER TABLE ONLY public.memory_settings
    ADD CONSTRAINT memory_settings_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: messages messages_conversation_id_conversations_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: bunker_user
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_conversation_id_conversations_id_fk FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;


--
-- Name: messages messages_conversation_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: bunker_user
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_conversation_id_fk FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_user_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: bunker_user
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_user_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: bunker_user
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_memory_facts user_memory_facts_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: bunker_user
--

ALTER TABLE ONLY public.user_memory_facts
    ADD CONSTRAINT user_memory_facts_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: video_interactions video_interactions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: bunker_user
--

ALTER TABLE ONLY public.video_interactions
    ADD CONSTRAINT video_interactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: video_interactions video_interactions_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: bunker_user
--

ALTER TABLE ONLY public.video_interactions
    ADD CONSTRAINT video_interactions_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: video_interactions video_interactions_video_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: bunker_user
--

ALTER TABLE ONLY public.video_interactions
    ADD CONSTRAINT video_interactions_video_id_fkey FOREIGN KEY (video_id) REFERENCES public.videos(id) ON DELETE CASCADE;


--
-- Name: video_interactions video_interactions_video_id_videos_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: bunker_user
--

ALTER TABLE ONLY public.video_interactions
    ADD CONSTRAINT video_interactions_video_id_videos_id_fk FOREIGN KEY (video_id) REFERENCES public.videos(id) ON DELETE CASCADE;


--
-- Name: videos videos_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: bunker_user
--

ALTER TABLE ONLY public.videos
    ADD CONSTRAINT videos_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: videos videos_author_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: bunker_user
--

ALTER TABLE ONLY public.videos
    ADD CONSTRAINT videos_author_id_users_id_fk FOREIGN KEY (author_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict anmP9OXgOvJkVcy98EO6q1q4KI9uRzXVQ0lmSyU8OqFtti0Rp5cH7Qagn59HHEr

--
-- Database "postgres" dump
--

\connect postgres

--
-- PostgreSQL database dump
--

\restrict oYg5A0uoJxEb6ufEYpj8JYI6pn10BTHvUD1UK5erbh28LbyczOe5qz2W2zlVMw3

-- Dumped from database version 16.14
-- Dumped by pg_dump version 16.14

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- PostgreSQL database dump complete
--

\unrestrict oYg5A0uoJxEb6ufEYpj8JYI6pn10BTHvUD1UK5erbh28LbyczOe5qz2W2zlVMw3

--
-- PostgreSQL database cluster dump complete
--

