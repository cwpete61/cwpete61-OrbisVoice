--
-- PostgreSQL database dump
--

-- Dumped from database version 17.2
-- Dumped by pg_dump version 17.2

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: test_connection_postgres; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.test_connection_postgres (
    id integer NOT NULL,
    name text
);


ALTER TABLE public.test_connection_postgres OWNER TO postgres;

--
-- Name: test_connection_postgres_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.test_connection_postgres_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.test_connection_postgres_id_seq OWNER TO postgres;

--
-- Name: test_connection_postgres_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.test_connection_postgres_id_seq OWNED BY public.test_connection_postgres.id;


--
-- Name: test_connection_postgres id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_connection_postgres ALTER COLUMN id SET DEFAULT nextval('public.test_connection_postgres_id_seq'::regclass);


--
-- Data for Name: test_connection_postgres; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.test_connection_postgres (id, name) FROM stdin;
1	connected_to_postgres
\.


--
-- Name: test_connection_postgres_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.test_connection_postgres_id_seq', 1, true);


--
-- Name: test_connection_postgres test_connection_postgres_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_connection_postgres
    ADD CONSTRAINT test_connection_postgres_pkey PRIMARY KEY (id);


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: pg_database_owner
--

GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;


--
-- Name: TABLE test_connection_postgres; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.test_connection_postgres TO anon;
GRANT ALL ON TABLE public.test_connection_postgres TO authenticated;
GRANT ALL ON TABLE public.test_connection_postgres TO service_role;


--
-- PostgreSQL database dump complete
--

