import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import RoomManagement from './RoomManagement'
import RoomAllocation from './RoomAllocation'

export default function FloorAndRoomManagement({ allocatingStudent, setAllocatingStudent }) {
    const location = useLocation()
    const navigate = useNavigate()
    
    // Default to 'allocation' if a student is passed, otherwise 'rooms'
    const [activeTab, setActiveTab] = useState(allocatingStudent ? 'allocation' : 'rooms')

    // Also watch location state in case we navigate here with a specific tab
    useEffect(() => {
        if (location.state?.tab) {
            setActiveTab(location.state.tab)
        } else if (allocatingStudent) {
            setActiveTab('allocation')
        }
    }, [location.state, allocatingStudent])

    return (
        <div className="animate-fade-in p-6">
            <div className="page-header mb-6">
                <h2>Floor & Room Management</h2>
                <p>Manage hostel infrastructure and assign beds to students</p>
            </div>

            {/* Custom Tab Navigation that mimics the style used in Profiles.jsx */}
            <div className="flex gap-4 border-b border-slate-200 dark:border-slate-700/50 mb-6">
                <button
                    onClick={() => {
                        setActiveTab('rooms')
                        navigate('.', { replace: true, state: { tab: 'rooms' } })
                    }}
                    className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === 'rooms'
                            ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                            : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
                    }`}
                >
                    Rooms & Floors
                </button>
                <button
                    onClick={() => {
                        setActiveTab('allocation')
                        navigate('.', { replace: true, state: { tab: 'allocation' } })
                    }}
                    className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === 'allocation'
                            ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                            : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
                    }`}
                >
                    Allocations
                </button>
            </div>

            {/* Tab Content */}
            <div className="tab-content">
                {activeTab === 'rooms' ? (
                    <RoomManagement />
                ) : (
                    <RoomAllocation 
                        allocatingStudent={allocatingStudent} 
                        setAllocatingStudent={setAllocatingStudent} 
                    />
                )}
            </div>
        </div>
    )
}
