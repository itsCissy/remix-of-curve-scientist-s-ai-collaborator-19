CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "plpgsql" WITH SCHEMA "pg_catalog";
CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";
BEGIN;

--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

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

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: branches; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.branches (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id uuid NOT NULL,
    parent_branch_id uuid,
    branch_point_message_id uuid,
    name text DEFAULT '主线'::text NOT NULL,
    description text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    is_main boolean DEFAULT false NOT NULL
);


--
-- Name: collaborators; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.collaborators (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id uuid NOT NULL,
    name text DEFAULT '匿名用户'::text NOT NULL,
    avatar_color text DEFAULT '#3B82F6'::text NOT NULL,
    browser_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id uuid NOT NULL,
    role text NOT NULL,
    content text NOT NULL,
    agent_id text,
    files jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    branch_id uuid,
    collaborator_id uuid,
    CONSTRAINT messages_role_check CHECK ((role = ANY (ARRAY['user'::text, 'assistant'::text])))
);


--
-- Name: projects; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.projects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    icon text DEFAULT '📋'::text NOT NULL,
    description text,
    author text NOT NULL,
    context_path text,
    selected_agents text[] DEFAULT ARRAY['xtalpi'::text],
    tags text[] DEFAULT ARRAY[]::text[],
    is_active boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: branches branches_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.branches
    ADD CONSTRAINT branches_pkey PRIMARY KEY (id);


--
-- Name: collaborators collaborators_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.collaborators
    ADD CONSTRAINT collaborators_pkey PRIMARY KEY (id);


--
-- Name: collaborators collaborators_project_id_browser_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.collaborators
    ADD CONSTRAINT collaborators_project_id_browser_id_key UNIQUE (project_id, browser_id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: projects projects_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_pkey PRIMARY KEY (id);


--
-- Name: idx_branches_parent; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_branches_parent ON public.branches USING btree (parent_branch_id);


--
-- Name: idx_branches_project_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_branches_project_id ON public.branches USING btree (project_id);


--
-- Name: idx_collaborators_project; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_collaborators_project ON public.collaborators USING btree (project_id);


--
-- Name: idx_messages_branch_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_messages_branch_id ON public.messages USING btree (branch_id);


--
-- Name: idx_messages_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_messages_created_at ON public.messages USING btree (created_at);


--
-- Name: idx_messages_project_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_messages_project_id ON public.messages USING btree (project_id);


--
-- Name: idx_projects_is_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_projects_is_active ON public.projects USING btree (is_active);


--
-- Name: projects update_projects_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: branches branches_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.branches
    ADD CONSTRAINT branches_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.collaborators(id) ON DELETE SET NULL;


--
-- Name: branches branches_parent_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.branches
    ADD CONSTRAINT branches_parent_branch_id_fkey FOREIGN KEY (parent_branch_id) REFERENCES public.branches(id) ON DELETE SET NULL;


--
-- Name: branches branches_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.branches
    ADD CONSTRAINT branches_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: collaborators collaborators_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.collaborators
    ADD CONSTRAINT collaborators_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: messages messages_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;


--
-- Name: messages messages_collaborator_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_collaborator_id_fkey FOREIGN KEY (collaborator_id) REFERENCES public.collaborators(id) ON DELETE SET NULL;


--
-- Name: messages messages_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: branches Anyone can create branches; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can create branches" ON public.branches FOR INSERT WITH CHECK (true);


--
-- Name: collaborators Anyone can create collaborators; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can create collaborators" ON public.collaborators FOR INSERT WITH CHECK (true);


--
-- Name: messages Anyone can create messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can create messages" ON public.messages FOR INSERT WITH CHECK (true);


--
-- Name: projects Anyone can create projects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can create projects" ON public.projects FOR INSERT WITH CHECK (true);


--
-- Name: branches Anyone can delete branches; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can delete branches" ON public.branches FOR DELETE USING (true);


--
-- Name: messages Anyone can delete messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can delete messages" ON public.messages FOR DELETE USING (true);


--
-- Name: projects Anyone can delete projects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can delete projects" ON public.projects FOR DELETE USING (true);


--
-- Name: branches Anyone can update branches; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can update branches" ON public.branches FOR UPDATE USING (true);


--
-- Name: collaborators Anyone can update collaborators; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can update collaborators" ON public.collaborators FOR UPDATE USING (true);


--
-- Name: projects Anyone can update projects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can update projects" ON public.projects FOR UPDATE USING (true);


--
-- Name: branches Anyone can view branches; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view branches" ON public.branches FOR SELECT USING (true);


--
-- Name: collaborators Anyone can view collaborators; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view collaborators" ON public.collaborators FOR SELECT USING (true);


--
-- Name: messages Anyone can view messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view messages" ON public.messages FOR SELECT USING (true);


--
-- Name: projects Anyone can view projects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view projects" ON public.projects FOR SELECT USING (true);


--
-- Name: branches; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;

--
-- Name: collaborators; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.collaborators ENABLE ROW LEVEL SECURITY;

--
-- Name: messages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

--
-- Name: projects; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--




COMMIT;