const TERM_MENU = ["Day", "Hour", "5 Minutes"];
const TERM_TOKEN = ["d", "h", "m"];

const TEMPLATE = {
    dashboard: {
        "overview": {
            "network": {
                network: {},
                options: {
                    height: "696"
                }
            },
            "line": {
                d: {
                    line: {
                        stacked: true,
                        xFormat: "%d일 %H시"
                    },
                    options: {
                        data: {
                            type: "area-spline",
                            order: "asc"
                        },
                        legend: {
                            show: false
                        }
                    }
                },
                h: {
                    line: {
                        stacked: true,
                        xFormat: "%H:%M"
                    },
                    options: {
                        data: {
                            type: "area-spline",
                            order: "asc"
                        },
                        legend: {
                            show: false
                        }
                    }
                },
                m: {
                    line: {
                        stacked: true,
                        xFormat: "%H:%M:%S"
                    },
                    options: {
                        data: {
                            type: "area-spline",
                            order: "asc"
                        },
                        legend: {
                            show: false
                        }
                    }
                }
            },
            "pie": {
                pie: {},
                options: {}
            },
            "total": {
                score: {}
            },
            "top": {
                pie: {},
                options: {}
            },
            "over_time": {
                d: {
                    line: {
                        xFormat: "%d일 %H시"
                    },
                    options: {}
                },
                h: {
                    line: {
                        xFormat: "%H:%M"
                    },
                    options: {}
                },
                m: {
                    line: {
                        xFormat: "%H:%M:%S"
                    },
                    options: {}
                }
            }
        },
        "alerts": {
            table: {}
        }
    },
    traffic: {
        "node": {
            "line": {
                d: {
                    line: {
                        stacked: true,
                        xFormat: "%d일 %H시"
                    },
                    options: {
                        data: {
                            type: "area-spline",
                            order: "asc"
                        }
                    }
                },
                h: {
                    line: {
                        stacked: true,
                        xFormat: "%H:%M"
                    },
                    options: {
                        data: {
                            type: "area-spline",
                            order: "asc"
                        }
                    }
                },
                m: {
                    line: {
                        stacked: true,
                        xFormat: "%H:%M:%S"
                    },
                    options: {
                        data: {
                            type: "area-spline",
                            order: "asc"
                        }
                    }
                }
            },
            "pie": {
                pie: {},
                options: {}
            }
        },
        "edge": {
            "line": {
                line: {},
                options: {
                    data: {},
                    legend: {
                        show: false
                    }
                }
            },
            "pie": {
                pie: {},
                options: {}
            }
        }
    },
    abnormal: {
        "alerts": {
            "total": {
                score: {
                    label: "Number of Alerts",
                    color: "lightgray"
                },
            },
            "types": {
                pie: {},
                options: {}
            },
            "line": {
                d: {
                    line: {
                        stacked: true,
                        xFormat: "%d일 %H시"
                    },
                    options: {
                        data: {
                            order: "asc"
                        },
                        color: {
                            pattern: ["#ef5350", "#ba68c8", "#7986cb", "#4db6ac", "#ffca28", "#ff8a65", "#90a4ae", "#8d6e63", "#8bc34a", "#64b5f6"]
                        }
                    }
                },
                h: {
                    line: {
                        stacked: true,
                        xFormat: "%H:%M"
                    },
                    options: {
                        data: {
                            order: "asc"
                        },
                        color: {
                            pattern: ["#ef5350", "#ba68c8", "#7986cb", "#4db6ac", "#ffca28", "#ff8a65", "#90a4ae", "#8d6e63", "#8bc34a", "#64b5f6"]
                        }
                    }
                },
                m: {
                    line: {
                        stacked: true,
                        xFormat: "%H:%M:%S"
                    },
                    options: {
                        data: {
                            order: "asc"
                        },
                        color: {
                            pattern: ["#ef5350", "#ba68c8", "#7986cb", "#4db6ac", "#ffca28", "#ff8a65", "#90a4ae", "#8d6e63", "#8bc34a", "#64b5f6"]
                        }
                    }
                }
            }
        },
        "anomalies": {
            "line": {
                score: {},
                table: {},
                editableTable: {},
                line: {
                    line: {
                        stacked: true,
                        xFormat: "%d일 %H시"
                    },
                    options: {
                        data: {
                            order: "asc"
                        }
                    }
                },
                zoomableLine: {
                    line: {},
                    options: {
                        data: {},
                        legend: {
                            show: false
                        }
                    }
                },
                pie: {},
                network: {
                    network: {},
                    options: {
                        height: "696"
                    }
                }
            },
            "table": {
                table: {}
            }
        },
    }
};