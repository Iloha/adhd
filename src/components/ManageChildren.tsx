"use client"

import { useState, type FormEvent } from "react"
import Button from "./Button"
import { AVATARS } from "../lib/avatars"
import type { Child } from "../types"

interface ManageChildrenProps {
  children: Child[]
  onAdd: (name: string, avatar: string) => Promise<boolean>
  onRename: (id: string, name: string) => Promise<boolean>
  onDelete: (id: string) => Promise<boolean>
}

const inputClass =
  "w-full min-h-12 text-base py-2 px-3 rounded-xl bg-white border border-gray-400 text-gray-900 placeholder-gray-600 focus:outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-700"
const smallButton = "min-h-12 px-4 rounded-xl text-base font-medium"

function ManageChildren({ children: childProfiles, onAdd, onRename, onDelete }: ManageChildrenProps) {
  const [newName, setNewName] = useState('')
  const [newAvatar, setNewAvatar] = useState<string>(AVATARS[0])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const submitNew = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (await onAdd(newName, newAvatar)) setNewName('')
  }

  const saveRename = async (id: string) => {
    if (await onRename(id, editName)) setEditingId(null)
  }

  const confirmDelete = async (id: string) => {
    await onDelete(id)
    setDeletingId(null)
  }

  return (
    <div className="max-w-2xl mx-auto py-8 space-y-8 text-left">
      {childProfiles.length > 0 && (
        <ul className="space-y-3">
          {childProfiles.map((child) => (
            <li key={child.id} className="bg-white rounded-xl p-4 border border-gray-200 space-y-3">
              {editingId === child.id ? (
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    aria-label={`New name for ${child.name}`}
                    className={`${inputClass} flex-1`}
                    maxLength={40}
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                  />
                  <button type="button" className={`${smallButton} bg-blue-600 text-white hover:bg-blue-700`} onClick={() => saveRename(child.id)}>Save</button>
                  <button type="button" className={`${smallButton} text-gray-700 hover:bg-gray-100`} onClick={() => setEditingId(null)}>Cancel</button>
                </div>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-lg font-bold text-gray-900">
                    {child.avatar && <span aria-hidden className="mr-2">{child.avatar}</span>}
                    {child.name}
                  </p>
                  <div className="flex gap-2">
                    <button type="button" aria-label={`Rename ${child.name}`} className={`${smallButton} text-blue-700 hover:bg-blue-50`} onClick={() => { setEditingId(child.id); setEditName(child.name); setDeletingId(null) }}>Rename</button>
                    <button type="button" aria-label={`Delete ${child.name}`} className={`${smallButton} text-red-700 hover:bg-red-50`} onClick={() => { setDeletingId(child.id); setEditingId(null) }}>Delete</button>
                  </div>
                </div>
              )}

              {deletingId === child.id && (
                <div role="alert" className="rounded-xl bg-red-50 border border-red-200 p-3 space-y-2">
                  <p className="text-red-900">Delete <strong>{child.name}</strong> and all of their tasks? This cannot be undone.</p>
                  <div className="flex gap-2">
                    <button type="button" className={`${smallButton} bg-red-700 text-white hover:bg-red-800`} onClick={() => confirmDelete(child.id)}>Yes, delete</button>
                    <button type="button" className={`${smallButton} text-gray-700 hover:bg-gray-100`} onClick={() => setDeletingId(null)}>Keep</button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={submitNew} className="bg-white rounded-xl p-4 border border-gray-200 space-y-4">
        <h3 className="text-lg font-bold text-gray-900">Add a child</h3>
        <div className="space-y-2">
          <label htmlFor="child-name" className="block font-bold text-gray-900">Name</label>
          <input id="child-name" className={inputClass} maxLength={40} placeholder="e.g., Alex" value={newName} onChange={(e) => setNewName(e.target.value)} />
        </div>
        <div role="group" aria-label="Avatar" className="flex flex-wrap gap-2">
          {AVATARS.map((avatar) => (
            <button
              key={avatar}
              type="button"
              aria-label={`Avatar ${avatar}`}
              aria-pressed={avatar === newAvatar}
              onClick={() => setNewAvatar(avatar)}
              className={`min-h-12 min-w-12 rounded-xl text-2xl border ${avatar === newAvatar ? 'border-blue-700 bg-blue-50 ring-2 ring-blue-700' : 'border-gray-300 bg-white hover:bg-gray-100'}`}
            >
              {avatar}
            </button>
          ))}
        </div>
        <Button type="submit" variant="secondary" disabled={newName.trim() === ''}>Add child</Button>
      </form>
    </div>
  )
}

export default ManageChildren
